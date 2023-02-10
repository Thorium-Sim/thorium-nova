import {NETREQUEST_PATH, NETSEND_PATH} from "../../constants";
import {FastifyInstance, FastifyReply, FastifyRequest} from "fastify";
import {AnyRouter, callProcedure} from "../../server/router";
import {inferRouterContext, MaybePromise} from "../../server/types";
import os from "os";
import multipart, {MultipartFile} from "@fastify/multipart";
import path from "path";
import uniqid from "@thorium/uniqid";
import {createWriteStream} from "fs";
import {pipeline} from "stream/promises";
import websocketPlugin, {SocketStream} from "@fastify/websocket";
import {ZodError} from "zod";
import {PubSub} from "../../server/pubsub";
import {SnapshotInterpolation} from "@thorium/snapshot-interpolation/src";
import {Snapshot} from "@thorium/snapshot-interpolation/src/types";
import {encode} from "@msgpack/msgpack";
import {EventEmitter} from "events";

export interface FastifyHandlerOptions<
  TRouter extends AnyRouter,
  TRequest extends FastifyRequest,
  TResponse extends FastifyReply,
  TContext
> {
  netSendPath?: string;
  netRequestPath?: string;
  router: TRouter;
  createContext?: (opts: {
    req: TRequest;
    res: TResponse;
    context: TContext;
  }) => MaybePromise<inferRouterContext<TRouter>>;
  createWSContext?: (opts: {
    connection: SocketStream;
    req: TRequest;
    context: TContext;
  }) => MaybePromise<inferRouterContext<TRouter>> & {id: string | number};
  extraContext: TContext;
}

function processBody(req: FastifyRequest) {
  let body = req.body as any;
  // For file uploads, we need to process the body differently
  if (req.isMultipart()) {
    let currentBody = body as Record<
      string,
      {fieldname: string; value: string; filename?: string}
    >;
    body = {};
    let fileParams = {} as any;
    for (const part in currentBody) {
      let key = currentBody[part].fieldname;
      let value = currentBody[part].value;
      let filename = currentBody[part].filename;
      let fieldname = currentBody[part].fieldname;
      if (value === "undefined") continue;
      if (!value) continue;
      // If this part is a file, store it separately to combine
      // with the body later
      if (filename) {
        fileParams[fieldname] = value;
      } else {
        // Params are JSON strings, so we need to parse them
        if (key === "params") {
          body = {...body, ...JSON.parse(value)};
        } else {
          body[key] = value;
        }
      }
    }
    body = {...body, ...fileParams};
  }

  return body;
}

export async function liveQueryPlugin<TRouter extends AnyRouter, TContext>(
  fastify: FastifyInstance,
  {
    createContext,
    createWSContext,
    netSendPath = NETSEND_PATH,
    netRequestPath = NETREQUEST_PATH,
    router,
    extraContext,
  }: FastifyHandlerOptions<TRouter, FastifyRequest, FastifyReply, TContext>,
  done: (err?: Error) => void
) {
  // Setup multipart requests
  async function onFile(part: MultipartFile) {
    const tmpdir = os.tmpdir();
    const filepath = path.join(
      tmpdir,
      uniqid("file-") + path.extname(part.filename)
    );
    // We need to differentiate between single and multiple file uploads
    if (part.fieldname.endsWith("[]")) {
      part.fields["filepath"] =
        part.fields["filepath"] ||
        ({
          ...part,
          fieldname: part.fieldname.replace("[]", ""),
          value: [],
        } as any);
      // @ts-expect-error We need to put this value on.
      part.fields[`filepath-${part.fieldname}`].value.push(filepath);
    } else {
      part.fields[`filepath-${part.fieldname}`] = {
        ...part,
        value: filepath,
      } as any;
    }
    await pipeline(part.file, createWriteStream(filepath));
  }

  await fastify.register(multipart, {attachFieldsToBody: true, onFile});

  function requestHandler(type: "send" | "request") {
    return async function handleRequest(
      req: FastifyRequest,
      res: FastifyReply
    ) {
      const ctx =
        (await createContext?.({req, res, context: extraContext})) || {};
      const {path, ...params} = processBody(req);

      try {
        const response = await callProcedure({
          procedures: router._def.procedures,
          path,
          ctx,
          rawInput: params,
          type,
        });

        // Send the result back to the client, regardless of what it is.
        return response;
      } catch (err) {
        if (err instanceof ZodError) {
          return res
            .code(400)
            .header("content-type", "application/json")
            .send(
              JSON.stringify({
                error: "Input Validation Error",
                ...err.flatten().fieldErrors,
              })
            );
        }
        let message = err;
        if (err instanceof Error) {
          message = err.message;
        }
        console.error(`Error in ${type} ${String(path)}: ${message}`);
        if (err instanceof Error && process.env.NODE_ENV !== "production")
          console.error(err.stack);
        return res
          .code(400)
          .header("content-type", "application/json")
          .send(JSON.stringify({error: message}));
      }
    };
  }
  // Setup API routes
  // This just maps all of the inputs to a single HTTP endpoint.
  // In the future, this could be changed to make it so each of
  // these is its own API endpoint.
  fastify.post(netSendPath, requestHandler("send"));
  fastify.post(netRequestPath, requestHandler("request"));

  // Set up Websocket route
  if (createWSContext) {
    await fastify.register(websocketPlugin);
    fastify.get("/ws", {websocket: true}, async (connection, req) => {
      try {
        if (!createWSContext) {
          connection.destroy();
          return;
        }
        const context: {id: string} = await createWSContext({
          connection,
          req,
          context: extraContext,
        });
        if (!context || !("id" in context) || !context.id) {
          connection.socket.send(
            JSON.stringify({
              error:
                "createWSContext must return an object with an `id` string property.",
            })
          );
          connection.destroy();
          return;
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
  done();
}

type SocketMessages =
  | {type: "connected"}
  | {
      type: "netRequestData";
      data: {id: string; error: any} | {id: string; data: any};
    }
  | Snapshot;
type IncomingMessage =
  | {
      type: "netRequest";
      id: string;
      path: string;
      params: any;
    }
  | {type: "netRequestEnd"; id: string}
  | {type: "dataStream"; id: string; path: string; params: any}
  | {type: "dataStreamEnd"; id: string};

export class ServerClient<TRouter extends AnyRouter> {
  SI = new SnapshotInterpolation();
  // This is necessary because of "Illegal Invocation" errors around the connection.socket
  // object. No idea how to solve it, so I just don't assign it to the class and use the
  // ee to pass messages to it.
  private ee = new EventEmitter();
  public connected = false;
  private subscriptions: Map<string, () => void> = new Map();
  protected dataStreams: Map<string, {path: string; params: any}> = new Map();
  constructor(
    public id: string,
    protected router: TRouter,
    private pubsub: PubSub<TRouter>
  ) {}
  encode(data: any) {
    return encode(data);
    // return JSON.stringify(data);
  }
  public async initWebSocket(
    connection: SocketStream,
    context: inferRouterContext<TRouter> & {pubsub?: PubSub<any>}
  ) {
    const send = (data: SocketMessages) => {
      if (!connection) return;
      try {
        const encodedData = this.encode(data);
        connection.socket.send(encodedData);
      } catch (err) {
        console.error(err);
        console.error("Data from the above error:", data);
      }
    };

    this.ee.removeAllListeners();
    this.ee.on("send", data => send(data));
    this.connected = true;
    if (!connection) {
      throw new Error(
        "ServerClient cannot be initialized before the socket is established."
      );
    }

    connection.socket.on("close", () => {
      this.connected = false;
      this.subscriptions.forEach(unsub => {
        unsub();
      });

      this.subscriptions.clear();
      this.connectionClosed();
    });

    // Set up the whole netSend process for calling input functions
    connection.socket.on("message", async data => {
      try {
        const messageData = JSON.parse(data.toString()) as IncomingMessage;
        switch (messageData.type) {
          case "netRequest": {
            const {path, id, params = {}} = messageData;

            const handleNetRequestError = (err: unknown) => {
              if (err === null) return;
              let message = err;
              if (err instanceof Error) {
                message = err.message;
              }
              console.error(`Error in request ${path}: ${message}`);
              if (err instanceof Error) console.error(err.stack);
              let jsonData = message;
              try {
                if (message) {
                  jsonData = JSON.parse(message as any);
                }
              } catch {
                // Do nothing
              }
              send({
                type: "netRequestData",
                data: {
                  id,
                  error: jsonData,
                },
              });
              this.subscriptions.get(id)?.();
              this.subscriptions.delete(id);
            };

            // If this client is already subscribed to this request, ignore the request.
            // It will already get the data it needs from the other request.
            try {
              if (!this.subscriptions.get(id)) {
                // Create the subscription
                const handleRequest = async (publish: any) => {
                  try {
                    const data = await callProcedure({
                      procedures: this.router._def.procedures,
                      path: path,
                      ctx: context,
                      rawInput: params,
                      publish,
                      type: "request",
                    });

                    send({type: "netRequestData", data: {id, data}});

                    return data as any;
                  } catch (err) {
                    handleNetRequestError(err);
                  }
                };
                function index(obj: any, i: keyof typeof obj) {
                  return obj[i];
                }
                const unSub = path
                  .split(".")
                  .reduce(index, this.pubsub.subscribe)(handleRequest, this.id);
                if (unSub) {
                  this.subscriptions.set(id, unSub);
                }
              }
              // Collect and send the initial data
              const data = await callProcedure({
                procedures: this.router._def.procedures,
                path: path,
                ctx: context,
                rawInput: params,
                type: "request",
              });

              send({
                type: "netRequestData",
                data: {
                  id,
                  data,
                },
              });
            } catch (err) {
              handleNetRequestError(err);
            }
            break;
          }
          case "netRequestEnd": {
            const {id} = messageData;
            if (this.subscriptions.get(id)) {
              this.subscriptions.get(id)?.();
              this.subscriptions.delete(id);
            }
            break;
          }
          case "dataStream": {
            const {id, path, params} = messageData;
            if (this.dataStreams.get(id)) return;
            this.dataStreams.set(id, {path, params});
            this.sendDataStream();
            break;
          }
          case "dataStreamEnd": {
            const {id} = messageData;
            this.dataStreams.delete(id);
            break;
          }
        }
      } catch (err) {
        console.error(
          `Client ${this.id} sent invalid request data:${
            typeof data === "object" ? JSON.stringify(data) : data
          }`
        );
        console.error(err);
      }
    });

    // Send a message to the client indicating that the connection is open
    send({
      type: "connected",
    });

    this.connectionOpened();
  }
  send(data: SocketMessages) {
    this.ee.emit("send", data);
  }
  public async sendDataStream() {
    // Filter the list of entities provided
  }
  connectionOpened() {}
  connectionClosed() {}
}
