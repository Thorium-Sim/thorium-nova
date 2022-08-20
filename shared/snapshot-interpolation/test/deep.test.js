const { SnapshotInterpolation } = require('../lib/index')

const tick = 1000 / 20

const delay = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, tick)
  })
}

const SI = new SnapshotInterpolation()
SI.interpolationBuffer.set(30) // this is only that low for testing

test('should add 2 shots', async () => {
  SI.addSnapshot(
    SI.snapshot.create({
      players: [
        { id: 0, x: 0, y: 0 },
        { id: 1, x: 0, y: 0 }
      ]
    })
  )

  await delay()

  SI.addSnapshot(
    SI.snapshot.create({
      players: [
        { id: 0, x: 10, y: 5 },
        { id: 1, x: 20, y: 50 }
      ]
    })
  )

  expect(SI.vault.size).toBe(2)
})

test('should interpolate the players array', () => {
  const snap = SI.calcInterpolation('x y', 'players')
  expect(snap.state[0].x > 0 && snap.state[0].x < 10).toBeTruthy()
  expect(snap.state[1].id).toBe(1)
})

test('should throw', () => {
  expect(() => {
    SI.calcInterpolation('x y')
  }).toThrow()
})
