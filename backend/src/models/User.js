// User 모델 (기본 구조)
// id, email, password, name, role(학생/직장인), teams(소속 팀)

// 추후 mongoose 스키마로 교체 예정
module.exports = {
  id: '',
  email: '',
  password: '',
  name: '',
  role: '', // 'student' | 'worker'
  teams: [], // 팀 id 배열
}; 