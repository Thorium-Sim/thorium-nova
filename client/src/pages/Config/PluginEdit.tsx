import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import {Suspense, useEffect, useState} from "react";
import {FaEdit} from "react-icons/fa";
import {Link, NavLink, useNavigate, useParams} from "react-router-dom";
import {toast} from "@client/context/ToastContext";
import {q} from "@client/context/AppContext";

export default function PluginEdit() {
  return (
    <div className="h-full">
      <Menubar></Menubar>
      <Suspense>
        <PluginEditInner />
      </Suspense>
    </div>
  );
}

function PluginEditInner() {
  const {pluginId} = useParams() as {pluginId: string};
  const [plugins] = q.plugin.all.useNetRequest();
  const navigate = useNavigate();
  const prompt = usePrompt();
  return (
    <div className="p-8 h-[calc(100%-2rem)]">
      <h1 className="font-bold text-white text-3xl mb-4">Plugin Config</h1>

      <div className="flex gap-8 h-[calc(100%-3rem)]">
        <div className="flex flex-col w-80 h-full">
          <Button
            className="w-full btn-sm btn-success"
            onClick={async () => {
              const name = await prompt({header: "Enter plugin name"});
              if (typeof name !== "string") return;
              try {
                const result = await q.plugin.create.netSend({name});
                navigate(`/config/${result.pluginId}`);
              } catch (err) {
                if (err instanceof Error) {
                  toast({
                    title: "Error creating plugin",
                    body: err.message,
                    color: "error",
                  });
                }
              }
            }}
          >
            New Plugin
          </Button>

          <SearchableList
            items={plugins.map(d => ({
              id: d.id,
              name: d.name,
              description: d.description,
              tags: d.tags,
              author: d.author,
              active: d.active,
            }))}
            searchKeys={["name", "author", "tags"]}
            selectedItem={pluginId || null}
            setSelectedItem={({id}) => navigate(`/config/${id}`)}
            renderItem={c => (
              <div className="flex justify-between items-center" key={c.id}>
                <div>
                  {c.name}
                  {c.active ? (
                    ""
                  ) : (
                    <span className="text-red-600"> (inactive)</span>
                  )}
                  <div>
                    <small>{c.author}</small>
                  </div>
                </div>
                <NavLink
                  {...{to: `/config/${c.id}/list`}}
                  onClick={e => e.stopPropagation()}
                >
                  <FaEdit />
                </NavLink>
              </div>
            )}
          />
        </div>
        <Suspense fallback={<PluginDetails />}>
          <PluginDetails />
        </Suspense>
      </div>
    </div>
  );
}

function PluginDetails() {
  const [error, setError] = useState(false);
  const confirm = useConfirm();
  const prompt = usePrompt();
  const navigate = useNavigate();
  const {pluginId} = useParams() as {pluginId: string};

  const [plugin, {isPreviousData}] = q.plugin.get.useNetRequest(
    {pluginId},
    {enabled: !!pluginId, keepPreviousData: true}
  );

  useEffect(() => {
    if (!plugin && !isPreviousData) {
      navigate("/config");
    }
  }, [plugin, navigate, isPreviousData]);

  return (
    <>
      <div className="w-96 space-y-4" key={plugin?.id}>
        <Input
          label="Plugin Name"
          defaultValue={plugin?.name}
          isInvalid={error}
          invalidMessage="Name is required"
          disabled={!plugin}
          onChange={() => setError(false)}
          onBlur={async (e: React.FocusEvent<Element>) => {
            const target = e.target as HTMLInputElement;
            if (!plugin) return;
            if (target.value) {
              try {
                const result = await q.plugin.update.netSend({
                  name: target.value,
                  pluginId: plugin.id,
                });
                navigate(`/config/${result.pluginId}`);
              } catch (err) {
                if (err instanceof Error) {
                  toast({
                    title: "Error renaming plugin",
                    body: err.message,
                    color: "error",
                  });
                }
              }
            } else {
              setError(true);
            }
          }}
        />
        <Input
          label="Description"
          as="textarea"
          className="h-64"
          defaultValue={plugin?.description}
          onChange={() => setError(false)}
          disabled={!plugin}
          onBlur={(e: React.FocusEvent<Element>) => {
            const target = e.target as HTMLInputElement;
            plugin &&
              q.plugin.update.netSend({
                description: target.value,
                pluginId: plugin.id,
              });
          }}
        />
        <TagInput
          label="Tags"
          tags={plugin?.tags || []}
          disabled={!plugin}
          onAdd={tag => {
            if (plugin?.tags.includes(tag) || !plugin) return;
            q.plugin.update.netSend({
              tags: [...plugin.tags, tag],
              pluginId: plugin.id,
            });
          }}
          onRemove={tag => {
            if (!plugin) return;
            q.plugin.update.netSend({
              tags: plugin.tags.filter(t => t !== tag),
              pluginId: plugin.id,
            });
          }}
        />
        {plugin?.active ? (
          <Button
            className="w-full btn-outline btn-warning"
            disabled={!pluginId}
            onClick={async () => {
              if (!pluginId) return;
              q.plugin.update.netSend({pluginId, active: false});
            }}
          >
            Deactivate Plugin
          </Button>
        ) : (
          <Button
            className="w-full btn-outline btn-success"
            disabled={!pluginId}
            onClick={async () => {
              if (!pluginId) return;
              q.plugin.update.netSend({pluginId, active: true});
            }}
          >
            Activate Plugin
          </Button>
        )}
        <Button
          className="w-full btn-outline btn-error"
          disabled={!pluginId}
          onClick={async () => {
            if (
              !pluginId ||
              !(await confirm({
                header: "Are you sure you want to delete this plugin?",
                body: "All content in this plugin, including images and other assets, will be gone forever.",
              }))
            )
              return;
            q.plugin.update.netSend({pluginId});
            navigate("/config");
          }}
        >
          Delete Plugin
        </Button>
        <Button
          className="w-full btn-outline btn-notice"
          disabled={!pluginId}
          onClick={async () => {
            if (!pluginId) return;
            const name = await prompt({
              header: "What is the name of the duplicated plugin?",
            });
            if (!name || typeof name !== "string") return;
            try {
              const result = await q.plugin.update.netSend({
                pluginId: pluginId,
                name,
              });
              navigate(`/config/${result.pluginId}`);
            } catch (err) {
              if (err instanceof Error) {
                toast({
                  title: "Error duplicating plugin",
                  body: err.message,
                  color: "error",
                });
                return;
              }
            }
          }}
        >
          Duplicate Plugin
        </Button>
        <Link
          className={`btn w-full btn-outline btn-warning ${
            !pluginId ? "btn-disabled" : ""
          }`}
          to={`/config/${pluginId}/list`}
        >
          Edit Plugin
        </Link>
      </div>
      <div>
        <label>
          <span className="flex">
            Cover Image{" "}
            <InfoTip>
              Used on the Thorium Plugin Registry. Images should be square and
              at least 1024x1024 in size.
            </InfoTip>
          </span>
          <UploadWell
            accept="image/*"
            onChange={(files: FileList) => {
              if (!plugin) return;
              q.plugin.update.netSend({
                pluginId: plugin.id,
                coverImage: files[0],
              });
            }}
          >
            {plugin?.coverImage && (
              <img
                src={`${plugin.coverImage}?${new Date().getTime()}`}
                className="w-[90%] h-[90%] object-cover"
                alt="Cover"
              />
            )}
          </UploadWell>
        </label>
      </div>
    </>
  );
}
