import {q} from "@client/context/AppContext";
import Button from "@thorium/ui/Button";
import Input from "@thorium/ui/Input";
import {useState} from "react";

const Login = () => {
  const [loginName, setLoginName] = useState("");
  // TODO: Support logging in with a ThoriumSim account
  const [ship] = q.ship.get.useNetRequest();
  const login = () => {
    if (loginName.trim().length > 0) {
      // TODO: Play a sound effect when the user logs in
      q.client.login.netSend({name: loginName});
    }
  };
  return (
    <div className="card-login flex flex-col items-center justify-center h-full">
      <img
        className="card-login-image max-h-72 mb-8"
        draggable={false}
        src={ship.components.isShip?.assets.logo}
        alt={ship.components.identity?.name}
      />
      <h2 className="card-login-ship-name text-6xl font-bold mb-4">
        {ship.components.identity?.name}
      </h2>
      <h3 className="card-login-ship-registry text-4xl font-bold mb-8">
        {ship.components.isShip?.registry}
      </h3>
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
          onChange={e => setLoginName(e.target.value)}
          value={loginName}
        />
        <Button
          className="w-72 btn-primary"
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
