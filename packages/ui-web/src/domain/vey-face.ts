import type { VeyExpression } from "@veylo/backend/domain/vey-expressions";

export interface VeyFace {
  leftEye: number;
  rightEye: number;
  leftLid: number;
  rightLid: number;
  brows: number;
  leftBrow: number;
  rightBrow: number;
  leftBrowLift: number;
  rightBrowLift: number;
  browCurve: number;
  smile: number;
  smirk: number;
  joy: number;
  mouth: number;
}

const relaxedFace: VeyFace = {
  leftEye: 1,
  rightEye: 1,
  leftLid: 0,
  rightLid: 0,
  brows: 0,
  leftBrow: 0,
  rightBrow: 0,
  leftBrowLift: 0,
  rightBrowLift: 0,
  browCurve: -2,
  smile: 0.7,
  smirk: 0,
  joy: 0,
  mouth: 0,
};

const expressions: Partial<Record<VeyExpression, Partial<VeyFace>>> = {
  happy: { leftEye: 0.88, rightEye: 0.88, smile: 1.4 },
  love: { joy: 1, smile: 1.4 },
  excited: { leftEye: 1.1, rightEye: 1.1, smile: 1.5 },
  angry: {
    leftEye: 0.72,
    rightEye: 0.72,
    leftLid: 4,
    rightLid: -4,
    brows: 1,
    leftBrow: 5,
    rightBrow: -5,
    browCurve: 0.5,
    smile: -0.8,
  },
  furious: {
    leftEye: 0.62,
    rightEye: 0.62,
    leftLid: 5,
    rightLid: -5,
    brows: 1,
    leftBrow: 6,
    rightBrow: -6,
    browCurve: 0.5,
    smile: -1,
  },
  skeptical: {
    leftEye: 0.48,
    rightEye: 0.9,
    leftLid: 1.5,
    brows: 1,
    leftBrow: 1,
    rightBrow: -2,
    rightBrowLift: -7,
    browCurve: -3,
    smile: 0.2,
    smirk: 6,
  },
  cheeky: { leftEye: 0.7, rightEye: 0.95, smile: 1, smirk: 5 },
  smug: { leftEye: 0.55, rightEye: 0.55, smile: 0.65, smirk: 4 },
  annoyed: {
    leftEye: 0.55,
    rightEye: 0.55,
    brows: 1,
    leftBrow: 3,
    rightBrow: -3,
    smile: -0.3,
  },
  unamused: { leftEye: 0.5, rightEye: 0.5, smile: 0 },
  sad: { brows: 1, leftBrow: -4, rightBrow: 4, smile: -0.6 },
  devastated: {
    brows: 1,
    leftBrow: -5,
    rightBrow: 5,
    smile: -1,
    leftEye: 0.7,
    rightEye: 0.7,
  },
  sheepish: { brows: 0.7, leftBrow: -3, rightBrow: 3, smile: 0.3, smirk: 3 },
  wince: { leftEye: 0.2, rightEye: 0.55, smile: -0.4, smirk: -3 },
  surprised: {
    leftEye: 1.15,
    rightEye: 1.15,
    brows: 1,
    leftBrowLift: -5,
    rightBrowLift: -5,
    mouth: 0.45,
  },
  horrified: {
    leftEye: 1.15,
    rightEye: 1.15,
    brows: 1,
    leftBrow: -4,
    rightBrow: 4,
    mouth: 0.6,
  },
  asleep: { leftEye: 0.08, rightEye: 0.08, smile: 0.2 },
};

export function veyFaceFor(expression?: VeyExpression): VeyFace {
  return { ...relaxedFace, ...(expression ? expressions[expression] : {}) };
}

export function veyFaceGeometry(face: VeyFace, smile = face.smile) {
  const lid = (x: number, y: number, openness: number, slope: number) => {
    const top = y + 8 - openness * 22;
    return `M ${x - 11} ${top - slope} Q ${x} ${top - 2} ${x + 11} ${top + slope} V ${y + 16} H ${x - 11} Z`;
  };
  const brow = (x: number, lift: number, tilt: number) =>
    `M ${x - 9} ${158 + lift - tilt} Q ${x} ${158 + lift + face.browCurve} ${x + 9} ${158 + lift + tilt}`;
  return {
    leftLid: lid(93, 178, face.leftEye, face.leftLid),
    rightLid: lid(137, 177, face.rightEye, face.rightLid),
    leftBrow: brow(93, face.leftBrowLift, face.leftBrow),
    rightBrow: brow(137, face.rightBrowLift, face.rightBrow),
    smile: `M 102 ${202 + face.smirk * 0.35} Q 118 ${202 + smile * 13} 134 ${202 - face.smirk}`,
  };
}

export class VeyFaceModel {
  private current: VeyFace;
  private target: VeyFace;

  constructor(expression?: VeyExpression) {
    this.current = veyFaceFor(expression);
    this.target = { ...this.current };
  }

  transition(expression?: VeyExpression) {
    this.target = veyFaceFor(expression);
  }

  sample(elapsed: number, reduced = false) {
    const blend = reduced ? 1 : 1 - Math.exp(-Math.min(64, elapsed) / 90);
    for (const key of Object.keys(this.target) as (keyof VeyFace)[])
      this.current[key] += (this.target[key] - this.current[key]) * blend;
    return { ...this.current };
  }
}
