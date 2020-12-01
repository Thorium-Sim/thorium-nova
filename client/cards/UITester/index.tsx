import Button from "client/components/ui/button";

const UITester = () => {
  return (
    <div className="space-x-4">
      <Button variantColor="primary">Primary</Button>
      <Button variantColor="secondary">Secondary</Button>
      <Button variantColor="info">Info</Button>
      <Button variantColor="success">Success</Button>
      <Button variantColor="warning">Warning</Button>
      <Button variantColor="danger">Danger</Button>
      <Button variantColor="alert">Alert</Button>
      <Button variantColor="muted">Muted</Button>
    </div>
  );
};

export default UITester;
