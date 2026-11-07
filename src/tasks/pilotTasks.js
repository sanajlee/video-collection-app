export const pilotTasks = [
  {
    id: "vowel_001",
    title: "모음 연장발성_001",
    instruction:
      "숨을 크게 들이쉰 다음 /아/를 최대한 길게 두 번 발성해 주세요.",

    items: [
      {
        id: "vowel_001",
        type: "text",
        prompt: "아, 아",
      },
    ],
  },

  {
    id: "vowel_002",
    title: "모음 연장발성_002",
    instruction:
      "/아/, /이/, /우/, /에/, /오/를 편하게 3-5초 동안 발성해 주세요.",

    items: [
      {
        id: "vowel_002",
        type: "text",
        prompt: "아, 이, 우, 에, 오",
      },
    ],
  },


  {
    id: "cv_iua",
    title: "CV 반복 01",
    instruction:
      "최대한 빠르고 정확하게 발음해 주세요.",

    items: [
      {
        id: "cv_iua_001",
        type: "text",
        prompt: "비비비비비비",
      },
      {
        id: "cv_iua_002",
        type: "text",
        prompt: "부부부부부부",
      },
      {
        id: "cv_iua_003",
        type: "text",
        prompt: "바바바바바바",
      },
    ],
  },


    {
    id: "cv_ptk",
    title: "CV 반복 02",
    instruction:
      "최대한 빠르고 정확하게 발음해 주세요.",

    items: [
      {
        id: "cv_ptk_001",
        type: "text",
        prompt: "퍼퍼퍼퍼퍼퍼",
      },
      {
        id: "cv_ptk_002",
        type: "text",
        prompt: "터터터터터터",
      },
      {
        id: "cv_ptk_003",
        type: "text",
        prompt: "커커커커커커",
      },
    ],
  },

    {
    id: "cv_ptkptk",
    title: "CV 반복 03",
    instruction:
      "최대한 빠르고 정확하게 /퍼터커/를 여러 번 반복해 주세요.",

    items: [
      {
        id: "cv_ptkptk",
        type: "text",
        prompt: "퍼터커",
      },
    ],
  },


  {
    id: "picture",
    title: "그림 설명하기",
    instruction:
      "그림을 보고 무엇이 보이는지 자유롭게 설명해주세요.",

    items: [
      {
        id: "picture_001",
        type: "image",
        imageSrc: "/stimuli/picture_001.png",
      },
      {
        id: "picture_002",
        type: "image",
        imageSrc: "/stimuli/picture_002.png",
      },
    ],
  },

  {
    id: "monologue",
    title: "자유롭게 이야기하기",
    instruction:
      "화면에 제시된 주제에 대해 자유롭게 이야기해주세요.",

    items: [
      {
        id: "monologue_001",
        type: "topic",
        prompt: "평소 하루를 어떻게 보내시는지, 아침, 점심, 저녁, 자기 전 일과에 대해 순서대로 이야기해 주세요.",
      },
      {
        id: "monologue_002",
        type: "topic",
        prompt: "라면을 끓이는 방법을, 한 번도 해 본 적 없는 사람에게 설명한다고 생각하고 처음부터 끝까지 말씀해 주세요.",
      },
    ],
  },
];