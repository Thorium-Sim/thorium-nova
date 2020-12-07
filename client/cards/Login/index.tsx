import {useClientData} from "client/components/clientLobby/ClientContext";
import Button from "client/components/ui/button";
import Input from "client/components/ui/Input";
import {useClientLoginMutation} from "client/generated/graphql";
import {useState} from "react";

const Login = () => {
  const [loginName, setLoginName] = useState("");
  // TODO: Support logging in with a ThoriumSim account
  const {ship} = useClientData();
  const [loginMutation] = useClientLoginMutation({variables: {loginName}});
  const login = () => {
    if (loginName.trim().length > 0) {
      // TODO: Play a sound effect when the user logs in
      loginMutation();
    }
  };
  return (
    <div className="card-login flex flex-col items-center justify-center h-full">
      <img
        className="card-login-image max-h-72 mb-8"
        draggable={false}
        src={ship.shipAssets?.logo}
        alt={ship.identity.name}
      />
      <h2 className="card-login-ship-name text-6xl font-bold mb-8">
        {ship.identity.name}
      </h2>
      {/* TODO: Add a registry number here someday. */}
      <form
        onSubmit={e => {
          e.preventDefault();
          login();
        }}
      >
        <Input
          fixed
          label="Login Name"
          className="w-72"
          onChange={e => setLoginName(e)}
          value={loginName}
        />
        <Button
          size="lg"
          className="w-72"
          variantColor="primary"
          type="submit"
          disabled={loginName.trim().length === 0}
        >
          Login
        </Button>
      </form>
    </div>
  );
};
export default Login;
