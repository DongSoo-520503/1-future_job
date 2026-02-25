const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();


app.use(express.json()); // JSON 요청 파싱 [[4](https://expressjs.com/en/api.html)]
app.use(express.static(__dirname)); // index.html 등 정적 파일 서비스 [[3](https://dev.to/kendalmintcode/how-to-build-a-restful-node-js-api-server-using-json-files-33m0)]

// JSON 데이터 로드 (파일 경로: ./data/future_job_final_1980.json) [[2](https://blog.logrocket.com/reading-writing-json-files-node-js-complete-tutorial/)]
const jobData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'future_job_final_1980.json'), 'utf8'));

app.post('/recommend', (req, res) => {
    const { name, dob, country, ability, riasec, big5 } = req.body;
    const year = new Date(dob).getFullYear() + 25;
    const period = `${Math.floor(year / 10) * 10}년대`;

    // 1. 조건 필터링
    const candidates = jobData.filter(row => 
        row['국가'] === country && row['시기'] === period && row['직업등급'] === ability
    );

    const candidateCount = candidates.length;

    // 2. 성향 점수화 및 정렬
    candidates.forEach(row => {
        const riasecMatch = row['직업해설'].includes(riasec) ? 60 : 0;
        const big5Match = row['직업해설'].includes(big5) ? 40 : 0;
        row.score = riasecMatch + big5Match;
    });

    candidates.sort((a, b) => b.score - a.score || a['연봉순위'] - b['연봉순위']);
    const best = candidates[0];

    if (!best) return res.status(404).json({ error: "매칭되는 직업이 없습니다." });

    // 요청하신 말투와 형식 그대로 출력
    const output = `

1. 출력 결과 

성명: ${name}
국가: ${country} / 취업시기: ${period}
추천직업: ${best['추천직업']}
연봉순위: ${period} 대한민국 10대 유망 미래 직종 중 ${best['연봉순위']}위에 해당될 만큼 높은 가치를 지닙니다 .
직업해설: ${best['직업해설']}
핵심 전문지식: ${best['핵심 전문지식']}
추천 학과/전공: ${best['추천 학과/전공']}
준비 기간: ${best['준비 기간']}

2. 매칭 분석

조건 필터링: 국가, 시기, 등급 데이터를 기반으로 1차 후보군 ${candidateCount}개를 추출하였습니다.
성향 점수화: 입력하신 직업흥미유형(60%)과 개인성향(40%) 가중치를 적용한 키워드 매칭 분석결과, 추천직업의 해설과 잘 맞아 적합도 점수 ${best.score}점을 획득하였습니다.
최종 선택: 적합도 점수와 연봉순위를 종합하여 최적의 직업 1종을 선정 하였습니다.`;

    res.json({ message: output });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
