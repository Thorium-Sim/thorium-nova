const { Vault, SnapshotInterpolation } = require('../lib/index')

const vault = new Vault()
const tick = 1000 / 20
let snapshotId

const delay = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, tick)
  })
}

test('empty vault size should be 0', () => {
  expect(vault.size).toBe(0)
})

test('get a snapshot that does not yet exist', () => {
  const shot = vault.get(new Date().getTime() - tick * 3, true)
  expect(shot).toBeUndefined()
})

test('max vault size should be 120', () => {
  expect(vault.getMaxSize()).toBe(120)
})

test('max vault size should be increased to 180', () => {
  vault.setMaxSize(180)
  expect(vault.getMaxSize()).toBe(180)
})

test('add a snapshot to the vault', async () => {
  await delay()
  const snapshot = SnapshotInterpolation.CreateSnapshot([{ id: 'hero', x: 10, y: 10 }])
  snapshotId = snapshot.id
  vault.add(snapshot)
  expect(vault.size).toBe(1)
})

test('decrease max vault size', () => {
  vault.setMaxSize(2)
  expect(vault.getMaxSize()).toBe(2)
})

test('get a snapshot by its id', () => {
  const snapshot = vault.getById(snapshotId)
  expect(snapshot.id).toBe(snapshotId)
})

test('add more snapshots to the vault', async () => {
  vault.setMaxSize(4)
  await delay()
  vault.add(SnapshotInterpolation.CreateSnapshot([{ id: 'hero', x: 20, y: 20 }]))
  await delay()
  vault.add(SnapshotInterpolation.CreateSnapshot([{ id: 'hero', x: 30, y: 30 }]))
  await delay()
  vault.add(SnapshotInterpolation.CreateSnapshot([{ id: 'hero', x: 40, y: 40 }]))
  await delay()
  vault.add(SnapshotInterpolation.CreateSnapshot([{ id: 'hero', x: 50, y: 50 }]))
  expect(vault.size).toBe(4)
})

test('get some closest snapshot to a specific time', () => {
  const shot1 = vault.get(new Date().getTime() - tick * 3 + 10, true)
  const shot2 = vault.get(new Date().getTime() - tick * 3 + 20, true)
  const shot3 = vault.get(new Date().getTime() - tick * 3 + 30, true)
  expect(shot1.id.length + shot2.id.length + shot3.id.length).toBe(18)
})
