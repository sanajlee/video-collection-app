export const pilotTasks = [
  {
    id: "reading",
    title: "문장 읽기",
    instruction:
      "화면에 제시된 문장을 평소 말하듯 자연스럽게 읽어주세요.",

    items: [
      {
        id: "reading_001",
        type: "text",
        prompt: "오늘 아침에는 날씨가 꽤 쌀쌀했습니다.",
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
        prompt: "최근에 즐겁게 했던 일",
      },
      {
        id: "monologue_002",
        type: "topic",
        prompt: "좋아하는 장소",
      },
    ],
  },
];