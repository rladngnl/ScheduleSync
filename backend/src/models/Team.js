// Team 모델 (기본 구조)
// id, name, members(사용자 id 배열), schedules(일정 id 배열)

// 추후 mongoose 스키마로 교체 예정
module.exports = {
  id: '',
  name: '',
  members: [], // 사용자 id 배열
  schedules: [], // 일정 id 배열
}; 