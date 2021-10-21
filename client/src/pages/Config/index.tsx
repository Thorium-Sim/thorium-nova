import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";

export default function Config() {
  return (
    <div className="h-full">
      <Menubar></Menubar>
      <div className="p-8">
        <h1 className="font-bold text-white text-3xl">Plugin Config</h1>

        <div className="flex gap-4 justify-between">
          <div className="flex-col w-80">
            <SearchableList
              items={[
                {
                  id: 1,
                },
              ]}
            />
          </div>
          <div className="bg-red-200">hi</div>
        </div>
      </div>
    </div>
  );
}
