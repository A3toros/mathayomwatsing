import"./shared-C67Vj5xU.js";let i=!1;async function _(){if(i){console.log("loadStudentTestResults already in progress, skipping duplicate call");return}i=!0,console.log("loadStudentTestResults called - extracting studentId from JWT token");try{console.log("Fetching test results using JWT authentication...");const o=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-student-test-results");console.log("Test results response received:",o),console.log("Test results response status:",o.status);const s=await o.json();console.log("Test results data:",s),s.success?(console.log("Successfully loaded test results, calling displayStudentTestResults"),console.log("Raw results array length:",s.results.length),s.results.forEach((n,a)=>{console.log(`Result ${a+1}:`,{test_type:n.test_type,test_id:n.test_id,id:n.id,student_id:n.student_id,test_name:n.test_name,subject:n.subject,score:n.score,max_score:n.max_score,all_fields:Object.keys(n),full_result:n})}),h(s.results)):console.error("Error loading student test results:",s.error)}catch(o){console.error("Error loading student test results:",o)}finally{i=!1}}function h(o){console.log("displayStudentTestResults called with results:",o),console.log("Results array type:",Array.isArray(o)),console.log("Results array length:",o.length);const s=document.getElementById("studentTestResults");if(!s){console.error("studentTestResults container not found");return}if(console.log("Test results container found, results length:",o.length),console.log("Container current content length:",s.innerHTML.length),s.innerHTML="",console.log("Container cleared, new content length:",s.innerHTML.length),o.length===0){console.log('No test results found, showing "no results" message'),s.innerHTML="<p>No test results available yet.</p>";return}const n=[],a=new Set;console.log("Starting deduplication process..."),o.forEach((e,t)=>{const c=e.test_id||e.id||e.test_name,r=e.student_id||"unknown",l=`${e.test_type}_${c}_${r}`;console.log(`Processing result ${t+1}:`,{uniqueKey:l,test_type:e.test_type,test_id:e.test_id,id:e.id,student_id:e.student_id,test_name:e.test_name,score:e.score,max_score:e.max_score}),a.has(l)?console.log(`❌ Duplicate result found and removed: ${l}`,e):(a.add(l),n.push(e),console.log(`✅ Added unique result: ${l}`))}),console.log("After deduplication, unique results count:",n.length),console.log("Unique keys found:",Array.from(a));const u={};n.forEach(e=>{const t=e.subject||"Unknown Subject",c=e.semester||"Unknown",r=e.term||"Unknown",l=`${t}_${c}_${r}`;u[l]||(u[l]={subject:t,semester:c,term:r,results:[]}),u[l].results.push(e)});const g=Object.values(u).sort((e,t)=>e.subject!==t.subject?e.subject.localeCompare(t.subject):e.semester!==t.semester?e.semester-t.semester:e.term-t.term);let d='<div class="test-results-tables">';g.forEach(e=>{d+=`
            <div class="results-group">
                <div class="table-container">
                    <table class="test-results-table">
                        <thead>
                            <tr>
                                <th>Subject</th>
                                <th>Teacher</th>
                                <th>Test Name</th>
                                <th>Score</th>
                            </tr>
                        </thead>
                        <tbody>
        `,e.results.forEach(t=>{const c=t.teacher_name||"Unknown",r=t.score_percentage>=80?"success":t.score_percentage>=60?"warning":"danger";d+=`
                <tr class="result-row ${r}">
                    <td data-label="Subject">${e.subject}</td>
                    <td data-label="Teacher">${c}</td>
                    <td data-label="Test Name">${t.test_name}</td>
                    <td class="score-cell" data-label="Score">${t.score}/${t.max_score}</td>
                </tr>
            `}),d+=`
                        </tbody>
                    </table>
                </div>
            </div>
        `}),d+="</div>",s.innerHTML=d,console.log("Final HTML content length:",s.innerHTML.length),console.log("Display function completed successfully")}export{h as displayStudentTestResults,_ as loadStudentTestResults};
