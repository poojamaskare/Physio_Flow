export const defaultExercise = {
  id: 'guided_posture_hold',
  name: 'Guided Posture Hold',
  description: 'Hold an upright stance with both arms raised and spine aligned.',
  holdDurationMs: 1500,
  baseSuccessThreshold: 0.82,
  segments: [
    {
      id: 'leftArmReach',
      label: 'Left Arm Reach',
      points: ['left_shoulder', 'left_elbow', 'left_wrist'],
      targetAngle: 172,
      tolerance: 12,
      weight: 1,
      cues: {
        low: 'Raise your left arm higher.',
        high: 'Relax the left wrist to avoid overextension.',
        aligned: 'Left arm locked in—great height!'
      }
    },
    {
      id: 'rightArmReach',
      label: 'Right Arm Reach',
      points: ['right_shoulder', 'right_elbow', 'right_wrist'],
      targetAngle: 172,
      tolerance: 12,
      weight: 1,
      cues: {
        low: 'Lift the right arm toward the ceiling.',
        high: 'Ease the right wrist down a touch.',
        aligned: 'Right arm is dialed in.'
      }
    },
    {
      id: 'spinalStack',
      label: 'Spinal Stack',
      points: ['left_hip', 'left_shoulder', 'left_ear'],
      targetAngle: 178,
      tolerance: 10,
      weight: 1.2,
      cues: {
        low: 'Straighten your back and lift the chest.',
        high: 'Keep the rib cage calm—don’t lean backward.',
        aligned: 'Spine tall and centered.'
      }
    },
    {
      id: 'hipAlignment',
      label: 'Hip Alignment',
      points: ['right_ankle', 'right_knee', 'right_hip'],
      targetAngle: 180,
      tolerance: 14,
      weight: 0.8,
      cues: {
        low: 'Drive through the standing leg to stack your hip.',
        high: 'Soften the hip hinge just a bit.',
        aligned: 'Lower body grounded and steady.'
      }
    }
  ]
}

export const localStorageKeys = {
  threshold: 'physioflow_targetAccuracy'
}
