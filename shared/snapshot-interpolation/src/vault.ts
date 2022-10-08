import { Snapshot, ID } from './types'

/** A save place to store your snapshots. */
export class Vault {
  private _vault: Snapshot[] = []
  private _vaultSize: number = 120

  /** Get a Snapshot by its ID. */
  getById(id: ID): Snapshot {
    return this._vault.filter(snapshot => snapshot.id === id)?.[0]
  }

  /** Clear this Vault */
  clear(): void {
    this._vault = []
  }

  /** Get the latest snapshot */
  get(): Snapshot | undefined
  /** Get the two snapshots around a specific time */
  get(time: number): { older: Snapshot; newer: Snapshot } | undefined
  /** Get the closest snapshot to e specific time */
  get(time: number, closest: boolean): Snapshot | undefined

  get(time?: number, closest?: boolean) {
    // zero index is the newest snapshot
    const sorted = this._vault.sort((a, b) => b.time - a.time)
    if (typeof time === 'undefined') return sorted[0]

    for (let i = 0; i < sorted.length; i++) {
      const snap = sorted[i]
      if (snap.time <= time) {
        const snaps = { older: sorted[i], newer: sorted[i - 1] }
        if (closest) {
          const older = Math.abs(time - snaps.older.time)
          const newer = Math.abs(time - snaps.newer?.time)
          if (isNaN(newer)) return snaps.older
          else if (newer <= older) return snaps.older
          else return snaps.newer
        }
        return snaps
      }
    }
    return
  }

  /** Add a snapshot to the vault. */
  add(snapshot: Snapshot) {
    if (this._vault.length > this._vaultSize - 1) {
      // remove the oldest snapshot
      this._vault.sort((a, b) => a.time - b.time).shift()
    }
    this._vault.push(snapshot)
  }

  /** Get the current capacity (size) of the vault. */
  public get size() {
    return this._vault.length
  }

  /** Set the max capacity (size) of the vault. */
  setMaxSize(size: number) {
    this._vaultSize = size
  }

  /** Get the max capacity (size) of the vault. */
  getMaxSize() {
    return this._vaultSize
  }
}
