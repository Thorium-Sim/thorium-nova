const PI = 3.14159265359
const PI_TIMES_TWO = 6.28318530718

export const lerp = (start: number, end: number, t: number) => {
  return start + (end - start) * t
}

// https://gist.github.com/itsmrpeck/be41d72e9d4c72d2236de687f6f53974
export const degreeLerp = (start: number, end: number, t: number) => {
  let result
  let diff = end - start
  if (diff < -180) {
    // lerp upwards past 360
    end += 360
    result = lerp(start, end, t)
    if (result >= 360) {
      result -= 360
    }
  } else if (diff > 180) {
    // lerp downwards past 0
    end -= 360
    result = lerp(start, end, t)
    if (result < 0) {
      result += 360
    }
  } else {
    // straight lerp
    result = lerp(start, end, t)
  }

  return result
}

// https://gist.github.com/itsmrpeck/be41d72e9d4c72d2236de687f6f53974
export const radianLerp = (start: number, end: number, t: number) => {
  let result
  let diff = end - start
  if (diff < -PI) {
    // lerp upwards past PI_TIMES_TWO
    end += PI_TIMES_TWO
    result = lerp(start, end, t)
    if (result >= PI_TIMES_TWO) {
      result -= PI_TIMES_TWO
    }
  } else if (diff > PI) {
    // lerp downwards past 0
    end -= PI_TIMES_TWO
    result = lerp(start, end, t)
    if (result < 0) {
      result += PI_TIMES_TWO
    }
  } else {
    // straight lerp
    result = lerp(start, end, t)
  }

  return result
}
