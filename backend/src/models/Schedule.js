// Schedule 모델 (기본 구조)
// id, title, description, start, end, priority, owner(사용자 id), team(팀 id), alarms(알림)

// 추후 mongoose 스키마로 교체 예정
module.exports = {
  id: '',
  title: '',
  description: '',
  start: '',
  end: '',
  priority: '', // 'high' | 'medium' | 'low'
  owner: '', // 사용자 id
  team: '', // 팀 id
  alarms: [], // 알림 정보
}; 