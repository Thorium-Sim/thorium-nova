export type Value = number | string | Quat | undefined

export interface Entity {
  id: string
  [key: string]: Value
}

export type ID = string
export type Time = number
export type State = Entity[]

export interface Snapshot {
  id: ID
  time: Time
  state: State | { [key: string]: State }
}

export interface InterpolatedSnapshot {
  state: State
  percentage: number
  older: ID
  newer: ID
}

export type Quat = { x: number; y: number; z: number; w: number }
