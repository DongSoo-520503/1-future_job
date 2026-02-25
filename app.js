const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const jobData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'future_job_final_1980.json'), 'utf8'));

const riasecKeywords = {
    'R': ['기술', '시스템', '설계', '구현', '디지털', '하드웨어', '장비', '에너지', '인프라', '연산'],
    'I': ['분석', '연구', '양자', '알고리즘', '데이터', '탐구', '과학', '개발'],
    'A': ['창의', '기획', '디자인', '서비스', '콘텐츠', '언어 모델', '명령어'],
    'S': ['의료', '건강', '보건', '복지', '커뮤니티', '상담', '교육', '사회'],
    'E': ['비즈니스', '경영', '전략', '정책', '법적', '우주', '민간', '리더'],
    'C': ['관리', '효율', '안전', '기준', '수립', '체계', '운영', '저장']
};

const big5Keywords = {
    'O': ['혁신', '차세대', '새로운', '창의', '미래', '개발', '기획'],
    'C': ['수립', '체계', '안전', '기준', '효율', '관리', '목표'],
    'E': ['소통', '서비스', '커뮤니티', '협업', '사회', '교육'],
    'A': ['의료', '건강', '복지', '보건', '공감', '신뢰', '지원'],
    'N': ['안정', '안전', '보호', '관리', '수소', '에너지']
};

app.post('/recommend', (req, res) => {
    const { name, dob, country, ability, riasec, big5 } = req.body;
    const year = new Date(dob).getFullYear() + 25;
    const period = `${Math.floor(year / 10) * 10}년대`;

    const candidates = jobData.filter(row =>
        row['국가'] === country && row['시기'] === period && row['직업등급'] === ability
    );
    const candidateCount = candidates.length;

    if (candidateCount === 0) {
        return res.status(404).json({
            error: `'${period}' 데이터가 없습니다. 지원 생년월일: 2005년~2034년생 (취업시기 2030~2050년대)`
        });
    }

    const rkws = riasecKeywords[riasec] || [];
    const bkws = big5Keywords[big5] || [];
    const totalRkws = rkws.length;
    const totalBkws = bkws.length;

    candidates.forEach(row => {
        const desc = row['직업해설'] || '';
        const riasecMatched = rkws.filter(kw => desc.includes(kw)).length;
        const big5Matched   = bkws.filter(kw => desc.includes(kw)).length;
        row.riasec_score = totalRkws > 0 ? (riasecMatched / totalRkws) * 100 : 0;
        row.big5_score   = totalBkws > 0 ? (big5Matched   / totalBkws) * 100 : 0;
        row.final_score  = Math.round((row.riasec_score * 0.6 + row.big5_score * 0.4) * 100) / 100;
    });

    candidates.sort((a, b) =>
        b.final_score - a.final_score || parseInt(a['연봉순위']) - parseInt(b['연봉순위'])
    );
    const best = candidates[0];

    // ✅ text 와 buttons 를 별도 필드로 분리해서 전송 → index.html에서 splitMarker 불필요
    const text = `1. 출력 결과

성명: ${name}
국가: ${country} / 취업시기: ${period}
추천직업: ${best['추천직업']}
연봉순위: ${period} ${country} 10대 유망 미래 직종 중 ${best['연봉순위']}위에 해당될 만큼 높은 가치를 지닙니다.
직업해설: ${best['직업해설']}
핵심 전문지식: ${best['핵심 전문지식']}
추천 학과/전공: ${best['추천 학과/전공']}
준비 기간: ${best['준비 기간']}

2. 매칭 분석

조건 필터링: 국가, 시기, 등급 데이터를 기반으로 1차 후보군 ${candidateCount}개를 추출하였습니다.
성향 점수화: 직업흥미유형(RIASEC) 키워드 매칭 비율 ${best.riasec_score.toFixed(1)}점, 개인성향(Big5) 키워드 매칭 비율 ${best.big5_score.toFixed(1)}점을 60:40 가중평균하여 최종 적합도 ${best.final_score}점을 산출하였습니다.
최종 선택: 적합도 점수와 연봉순위를 종합하여 최적의 직업 1종을 선정하였습니다.`;

    const buttons = `<div style="margin-top:12px;padding:16px;background:#f8f9fa;border-radius:10px;border:1px solid #dee2e6;"><p style="margin:0 0 12px 0;font-size:14px;font-weight:bold;color:#333;line-height:1.6;">💡 미래 직업 선택과 관련하여 궁금한 점이 있으시면, 아래의 L.L.M. 모델 중 본인이 가입한 모델을 눌러 문의해 보세요.</p><div style="display:flex;flex-direction:column;gap:8px;"><a href="https://chat.openai.com" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#10a37f;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">💬 ChatGPT &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">창작 · 글쓰기 · 대화에 강함</span></button></a><a href="https://gemini.google.com" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#4285f4;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">✨ Gemini &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">구글 연동 · 코딩에 강함</span></button></a><a href="https://claude.ai" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#d97706;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">🤖 Claude &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">심층 분석 · 문서 작성에 강함</span></button></a><a href="https://www.perplexity.ai" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#6366f1;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">🔎 Perplexity &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">정보검색 · 최신 웹 요약에 강함</span></button></a><a href="https://grok.com" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#1d9bf0;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">⚡ Grok &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">심층 질문 · 뉴스 분석에 강함</span></button></a><a href="https://chat.deepseek.com" target="_blank" style="text-decoration:none;"><button style="width:100%;padding:12px 16px;font-size:14px;font-weight:bold;background:#e53e3e;color:white;border:none;border-radius:8px;cursor:pointer;text-align:left;">🐋 DeepSeek &nbsp;|&nbsp; <span style="font-weight:normal;font-size:13px;">무료 · 코딩 · 논리 추론에 강함</span></button></a></div></div>`;

    // text, buttons 를 별도 필드로 분리 전송
    res.json({ text, buttons });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
