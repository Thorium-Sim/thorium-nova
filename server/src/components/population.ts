import {Component} from "./utils";

export class PopulationComponent extends Component {
    static id = "population" as const;
    //ok how do I define this?
    count: number | Range<number> = 0;
}