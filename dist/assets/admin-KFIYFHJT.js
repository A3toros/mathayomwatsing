import{b as m,a as g,s as u}from"./shared-C67Vj5xU.js";async function v(){if(!await m()){console.error("No valid admin session found in loadAllSubjects, redirecting to login"),g("login-section");return}try{const n=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-subjects")).json();n.success&&I(n.subjects)}catch(e){console.error("Error loading subjects:",e)}}async function I(t){if(!await m()){console.error("No valid admin session found in displayAllSubjects, redirecting to login"),g("login-section");return}const n=document.getElementById("allSubjectsContainer");n&&(n.innerHTML=`
        <h3>All Subjects</h3>
        <table>
            <thead>
                <tr>
                    <th>Subject ID</th>
                    <th>Subject Name</th>
                </tr>
            </thead>
            <tbody>
                ${t.map(s=>`
                    <tr>
                        <td>${s.subject_id}</td>
                        <td>${s.subject}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `)}function B(t,e){if(t.length===0){e.innerHTML="<p>No subjects found.</p>";return}const n=document.createElement("table");n.innerHTML=`
        <thead>
            <tr>
                <th>Subject ID</th>
                <th>Subject</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;const s=n.querySelector("tbody");t.forEach(o=>{const a=document.createElement("tr");a.innerHTML=`
            <td>${o.subject_id}</td>
            <td>${o.subject}</td>
        `,s.appendChild(a)}),e.innerHTML="",e.appendChild(n)}function ne(){const t=document.getElementById("allSubjectsContainer"),e=document.querySelector('button[onclick="toggleSubjectsContent()"]');if(!t){console.error("❌ allSubjectsContainer not found");return}if(!e){console.error("❌ Button not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",M(),e.textContent="Hide Subjects ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get All Subjects ▶",e.classList.remove("active"))}function oe(){document.getElementById("addSubjectForm").style.display="block"}function se(){document.getElementById("addSubjectForm").style.display="none",document.getElementById("newSubjectForm").reset()}async function k(){const t=localStorage.getItem("accessToken");if(!t){console.error("No valid session found in loadAcademicYear, redirecting to login"),g("login-section");return}const e=JSON.parse(atob(t.split(".")[1]));console.log("Loading academic year for user role:",e.role);try{const s=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-academic-year")).json();s.success&&L(s.academic_years)}catch(n){console.error("Error loading academic year:",n)}}async function L(t){const e=document.getElementById("academicYearTable");e&&(e.innerHTML=`
        <h3>Academic Years</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Academic Year</th>
                    <th>Semester</th>
                    <th>Term</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                </tr>
            </thead>
            <tbody>
                ${t.map(n=>`
                    <tr>
                        <td>${n.id}</td>
                        <td>${n.academic_year}</td>
                        <td>${n.semester}</td>
                        <td>${n.term}</td>
                        <td>${n.start_date}</td>
                        <td>${n.end_date}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `)}function ae(){const t=document.getElementById("addAcademicYearForm");if(t){t.style.display="block";const e=new Date,n=e.getFullYear(),s=e.getMonth()+1,o=document.getElementById("newAcademicYear");s>=7?o.value=`${n}-${n+1}`:o.value=`${n-1}-${n}`}}function ce(){const t=document.getElementById("addAcademicYearForm");t&&(t.style.display="none",document.getElementById("newAcademicYearForm").reset())}function F(){const t=document.getElementById("academicYearTable"),e=document.getElementById("checkAcademicYearBtn");if(!t){console.error("❌ academicYearTable not found");return}if(!e){console.error("❌ checkAcademicYearBtn not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",k(),e.textContent="Hide Academic Year ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Check Academic Year ▶",e.classList.remove("active"))}async function M(){try{const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-subjects")).json();if(e.success){const n=document.getElementById("allSubjectsContainer");B(e.subjects,n)}else console.error("Failed to get subjects:",e.message),showSampleSubjects()}catch(t){console.error("Error fetching subjects:",t),showSampleSubjects()}}async function j(){try{const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-users")).json();if(e.success){const n=document.getElementById("allUsersContainer");x(e.users,n)}else console.error("Failed to get users:",e.message),showSampleUsers()}catch(t){console.error("Error fetching users:",t),showSampleUsers()}}function x(t,e){if(t.length===0){e.innerHTML="<p>No users found.</p>";return}const n=document.createElement("table");n.innerHTML=`
        <thead>
            <tr>
                <th>Grade</th>
                <th>Class</th>
                <th>Number</th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Nickname</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;const s=n.querySelector("tbody");t.forEach(o=>{const a=document.createElement("tr");a.innerHTML=`
            <td>${o.grade}</td>
            <td>${o.class}</td>
            <td>${o.number}</td>
            <td>${o.student_id}</td>
            <td>${o.name}</td>
            <td>${o.surname}</td>
            <td>${o.nickname}</td>
        `,s.appendChild(a)}),e.innerHTML="",e.appendChild(n)}function le(){const t=document.getElementById("allUsersContainer"),e=document.querySelector('button[onclick="toggleUsersContent()"]');if(!t){console.error("❌ allUsersContainer not found");return}if(!e){console.error("❌ Button not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",j(),e.textContent="Hide Users ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get All Users ▶",e.classList.remove("active"))}function re(){document.getElementById("addUserForm").style.display="block"}function ie(){document.getElementById("addUserForm").style.display="none",document.getElementById("newUserForm").reset()}function de(){document.getElementById("addTeacherForm").style.display="block"}function ue(){document.getElementById("addTeacherForm").style.display="none",document.getElementById("newTeacherForm").reset()}async function A(){var e,n;const t=await m();if(!t){console.error("No valid admin session found in loadAllTeachers, redirecting to login"),g("login-section");return}console.log("Admin ID found:",t),console.log("Token manager available:",!!window.tokenManager),console.log("Token manager authenticated:",(e=window.tokenManager)==null?void 0:e.isAuthenticated());try{console.log("Making authenticated request to get-all-teachers...");const s=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-teachers");console.log("Response received:",s),console.log("Response status:",s.status);const o=await s.json();if(console.log("Teachers data received:",o),console.log("Teachers array:",o.teachers),console.log("Number of teachers:",((n=o.teachers)==null?void 0:n.length)||0),o.success){H(o.teachers);const a=document.getElementById("allTeachersContainer");a&&(a.style.display="block",console.log("Container shown after loading teachers"))}else console.error("Failed to load teachers:",o.error)}catch(s){console.error("Error loading teachers:",s)}}async function H(t){if(!await m()){console.error("No valid admin session found in displayAllTeachers, redirecting to login"),g("login-section");return}console.log("displayAllTeachers called with teachers:",t),console.log("Number of teachers to display:",t.length);const n=document.getElementById("allTeachersContainer");if(console.log("Container found:",!!n),console.log("Container element:",n),!n){console.error("allTeachersContainer not found!");return}const s=`
        <h3>All Teachers</h3>
        <table>
            <thead>
                <tr>
                    <th>Teacher ID</th>
                    <th>Username</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${t.map(o=>`
                    <tr>
                        <td>${o.teacher_id}</td>
                        <td>${o.username}</td>
                        <td>
                            <button onclick="editTeacher('${o.teacher_id}')">Edit</button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;console.log("Setting container HTML:",s),n.innerHTML=s,console.log("Container HTML set successfully")}function ge(){const t=document.getElementById("allTeachersContainer"),e=document.querySelector('button[onclick="toggleTeachersContent()"]');if(!t){console.error("❌ allTeachersContainer not found");return}if(!e){console.error("❌ Button not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",A(),e.textContent="Hide Teachers ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get All Teachers ▶",e.classList.remove("active"))}let d=[],$=[];function me(){console.log("🔧 initializeTestDeletion called"),console.log("🔧 DOM ready state:",document.readyState),console.log("🔧 Admin panel exists:",!!document.getElementById("admin-panel")),console.log("🔧 dataTeacherSelect exists:",!!document.getElementById("dataTeacherSelect")),console.log("🔧 assignmentTeacherSelect exists:",!!document.getElementById("assignmentTeacherSelect")),_(),N(),G()}async function _(){console.log("🔧 loadTeachersList called");try{const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-teachers")).json();console.log("🔧 Teachers response:",e),e.success?(d=e.teachers,console.log("🔧 Set teachersList to:",d),R()):console.error("Failed to load teachers:",e.message)}catch(t){console.error("Error loading teachers:",t)}}async function N(){try{const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-subjects")).json();e.success?($=e.subjects,q()):console.error("Failed to load subjects:",e.message)}catch(t){console.error("Error loading subjects:",t)}}function R(){console.log("🔧 populateTeacherDropdowns called"),console.log("🔧 teachersList:",d),console.log("🔧 teachersList length:",d.length),["assignmentTeacherSelect","dataTeacherSelect"].forEach(e=>{const n=document.getElementById(e);console.log(`🔧 Looking for select: ${e}, found:`,n),n?(n.innerHTML='<option value="">Select Teacher</option>',d.forEach(s=>{const o=document.createElement("option");o.value=s.teacher_id,o.textContent=s.username,n.appendChild(o)}),console.log(`🔧 Populated ${e} with ${d.length} teachers`)):console.log(`🔧 Select element ${e} not found!`)})}function q(){["assignmentSubjectSelect","dataSubjectSelect"].forEach(e=>{const n=document.getElementById(e);n&&(n.innerHTML='<option value="">All Subjects</option>',$.forEach(s=>{const o=document.createElement("option");o.value=s.subject_id,o.textContent=s.subject_name,n.appendChild(o)}))})}function G(){const t=document.getElementById("assignmentTeacherSelect");t&&t.addEventListener("change",o=>{S(o.target.value,"assignmentGradesClassesContainer")});const e=document.getElementById("dataTeacherSelect");e&&e.addEventListener("change",o=>{S(o.target.value,"dataGradesClassesContainer")});const n=document.getElementById("assignmentDeletionFormElement");n&&n.addEventListener("submit",O);const s=document.getElementById("testDataDeletionFormElement");s&&s.addEventListener("submit",z)}async function he(){document.getElementById("testDataDeletionForm").style.display="block",document.getElementById("assignmentDeletionForm").style.display="none",document.getElementById("testDataDeletionFormElement").reset(),document.getElementById("dataGradesClassesContainer").innerHTML=""}function U(){document.getElementById("testDataDeletionForm").style.display="none"}function Y(){document.getElementById("assignmentDeletionForm").style.display="none"}async function S(t,e){if(!t){document.getElementById(e).innerHTML="";const n=e==="dataGradesClassesContainer"?"dataSubjectSelect":"assignmentSubjectSelect",s=document.getElementById(n);s&&(s.innerHTML='<option value="">All Subjects</option>');return}try{const n=window.tokenManager.getAccessToken();let s="/.netlify/functions/get-teacher-grades-classes";if(n)try{window.tokenManager.decodeToken(n).role==="admin"&&(s+=`?teacher_id=${t}`)}catch(l){console.warn("Could not decode token for admin check:",l)}const a=await(await window.tokenManager.makeAuthenticatedRequest(s)).json();if(!a.success){console.error("Failed to load grades/classes:",a.message);return}const c=document.getElementById(e);if(c.innerHTML="",a.data.length===0){c.innerHTML="<p>No grades/classes found for this teacher.</p>";return}const r={};a.data.forEach(l=>{r[l.grade]||(r[l.grade]=[]),r[l.grade].push(l.class)}),Object.keys(r).sort().forEach(l=>{const h=document.createElement("div");h.className="grade-group";const T=document.createElement("h4");T.textContent=`Grade ${l}`,h.appendChild(T),r[l].sort().forEach(y=>{const f=document.createElement("div");f.className="grade-class-checkbox";const p=document.createElement("input");p.type="checkbox",p.id=`${l}-${y}`,p.value=`${l}-${y}`;const b=document.createElement("label");b.htmlFor=`${l}-${y}`,b.textContent=`Class ${y}`,f.appendChild(p),f.appendChild(b),h.appendChild(f)}),c.appendChild(h)}),P(t,e)}catch(n){console.error("Error loading grades/classes:",n),document.getElementById(e).innerHTML="<p>Error loading grades/classes.</p>"}}async function P(t,e){try{const n=`/.netlify/functions/get-teacher-subjects?teacher_id=${t}`,o=await(await window.tokenManager.makeAuthenticatedRequest(n)).json();if(!o.success){console.error("Failed to load teacher subjects:",o.message);return}const a=e==="dataGradesClassesContainer"?"dataSubjectSelect":"assignmentSubjectSelect",c=document.getElementById(a);if(!c){console.error(`Subject dropdown ${a} not found`);return}c.innerHTML='<option value="">All Subjects</option>',o.subjects&&o.subjects.length>0?(o.subjects.forEach(r=>{const l=document.createElement("option");l.value=r.subject_id,l.textContent=r.subject,c.appendChild(l)}),console.log(`🔧 Populated ${a} with ${o.subjects.length} teacher subjects`)):console.log(`🔧 No subjects found for teacher ${t}`)}catch(n){console.error("Error loading teacher subjects for dropdown:",n)}}async function O(t){if(t.preventDefault(),!confirm("Are you sure you want to delete test assignments? This action cannot be undone."))return;const e=new FormData(t.target),n=D("assignmentGradesClassesContainer");if(n.length===0){alert("Please select at least one grade/class combination.");return}const s=e.get("assignmentTeacherSelect");if(!s||s===""){alert("Please select a teacher.");return}const o={startDate:e.get("assignmentStartDate"),endDate:e.get("assignmentEndDate"),teacherId:e.get("assignmentTeacherSelect"),grades:n.map(a=>a.grade),classes:n.map(a=>a.class),subjectId:e.get("assignmentSubjectSelect")||null};console.log("🔧 Assignment deletion data:",o),console.log("🔧 Teacher ID from form:",e.get("assignmentTeacherSelect")),console.log("🔧 Teacher ID type:",typeof e.get("assignmentTeacherSelect")),console.log('🔧 Teacher ID === "":',e.get("assignmentTeacherSelect")==="");try{const a=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/delete-test-assignments",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),c=await a.json();a.ok&&c.success?(alert(`Successfully deleted ${c.deletedCount} test assignments.`),Y()):alert(`Error: ${c.message||"Failed to delete assignments"}`)}catch(a){console.error("Error deleting assignments:",a),alert("Error deleting assignments. Please try again.")}}async function z(t){if(t.preventDefault(),!confirm("Are you sure you want to delete test questions, results, and assignments? This action cannot be undone."))return;const e=new FormData(t.target),n=D("dataGradesClassesContainer");if(n.length===0){alert("Please select at least one grade/class combination.");return}const s=e.get("dataTeacherSelect");if(!s||s===""){alert("Please select a teacher.");return}const o={startDate:e.get("dataStartDate"),endDate:e.get("dataEndDate"),teacherId:e.get("dataTeacherSelect"),grades:n.map(a=>a.grade),classes:n.map(a=>a.class),subjectId:e.get("dataSubjectSelect")||null};console.log("DEBUG - Frontend deletion data:",o),console.log("DEBUG - Teacher ID from form:",e.get("dataTeacherSelect")),console.log("DEBUG - Teacher ID type:",typeof e.get("dataTeacherSelect")),console.log('DEBUG - Teacher ID === "":',e.get("dataTeacherSelect")==="");try{const a=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/delete-test-data",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)}),c=await a.json();a.ok&&c.success?(alert(`Successfully deleted ${c.deletedCount} test records and assignments.`),U()):alert(`Error: ${c.message||"Failed to delete test data"}`)}catch(a){console.error("Error deleting test data:",a),alert("Error deleting test data. Please try again.")}}function D(t){const n=document.getElementById(t).querySelectorAll('input[type="checkbox"]:checked');return Array.from(n).map(s=>{const[o,a]=s.value.split("-");return{grade:o,class:a}})}async function ye(){try{console.log("Checking which teachers have subjects assigned...");const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-teachers")).json();if(!e.success){console.error("Failed to load teachers:",e.message);return}console.log("Found teachers:",e.teachers);for(const n of e.teachers)try{const o=await(await window.tokenManager.makeAuthenticatedRequest(`/.netlify/functions/get-teacher-grades-classes?teacher_id=${n.teacher_id}`)).json();console.log(`Teacher ${n.username} (${n.teacher_id}):`,{hasSubjects:o.data.length>0,subjectCount:o.data.length,subjects:o.data})}catch(s){console.error(`Error checking teacher ${n.username}:`,s)}}catch(t){console.error("Error checking teacher subjects:",t)}}function i(t){console.log(`🔧 toggleSection called with sectionId: ${t}`);const e=Date.now();if(toggleDebounce[t]&&e-toggleDebounce[t]<300){console.log(`🔧 Ignoring rapid successive call for ${t}`);return}toggleDebounce[t]=e;const n=document.getElementById(t);if(!n){console.error(`❌ Section with id '${t}' not found!`);return}const s=n.previousElementSibling;if(!s||!s.classList.contains("section-header")){console.error(`❌ Header not found for section '${t}'!`);return}const o=n,a=o.classList.contains("collapsed");console.log(`🔧 Current state - collapsed: ${a}`),console.log(`🔧 Current classes: ${o.className}`),a?(o.classList.remove("collapsed"),s.classList.remove("collapsed"),console.log(`✅ Section ${t} expanded`),console.log(`🔧 Classes after expand: ${o.className}`)):(o.classList.add("collapsed"),s.classList.add("collapsed"),console.log(`✅ Section ${t} collapsed`),console.log(`🔧 Classes after collapse: ${o.className}`));const c=o.classList.contains("collapsed");console.log(`🔧 New state - collapsed: ${c}`),o.offsetHeight;const r=window.getComputedStyle(o);console.log(`🔧 Computed max-height: ${r.maxHeight}`),console.log(`🔧 Computed opacity: ${r.opacity}`)}function fe(){console.log("🔧 Adding click listeners to section headers...");const t=document.querySelectorAll(".section-header");console.log(`🔧 Found ${t.length} section headers`),t.forEach((e,n)=>{const s=e.textContent.trim();if(console.log(`🔧 Processing header ${n+1}:`,s),e.dataset.listenerAdded==="true"){console.log(`🔧 Skipping header ${s} - listener already added`);return}const o=e.getAttribute("onclick");o&&console.log(`🔧 Removed old onclick: ${o}`),e.removeAttribute("onclick");const a=function(c){console.log(`🔧 CLICK EVENT FIRED for header: ${s}`),console.log("🔧 Event target:",c.target),console.log("🔧 Current target:",c.currentTarget),c.preventDefault(),c.stopPropagation(),console.log(`🔧 Click event triggered for header: ${s}`);const r=this.nextElementSibling.id;console.log(`🔧 Section ID: ${r}`),this.style.background="rgba(255, 255, 255, 0.2)",setTimeout(()=>{this.style.background=""},200),i(r)};e.addEventListener("click",a),e.addEventListener("mousedown",function(c){console.log(`🔧 MOUSEDOWN detected on header: ${s}`)}),e.addEventListener("mouseup",function(c){console.log(`🔧 MOUSEUP detected on header: ${s}`)}),e.dataset.listenerAdded="true",e.style.cursor="pointer",e.style.position="relative",e.style.zIndex="1000",e.style.pointerEvents="auto",console.log(`✅ Added click listener to header: ${s}`)})}function pe(){document.querySelectorAll(".section-header").forEach(t=>{t.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();const n=this.nextElementSibling.id;i(n)}}),t.setAttribute("tabindex","0")})}function be(){console.log("🧪 Testing toggleSection function..."),console.log("🧪 toggleSection function exists:",typeof i),console.log("🧪 Available sections:",document.querySelectorAll(".section-content").length);const t=document.querySelector(".section-content");if(t){console.log("🧪 First section id:",t.id),console.log("🧪 First section classes:",t.className),console.log("🧪 Testing direct toggleSection call...");try{i(t.id),console.log("✅ Direct call successful!"),setTimeout(()=>{console.log("🧪 Testing reverse toggle..."),i(t.id),console.log("✅ Reverse toggle successful!")},1e3)}catch(e){console.error("❌ Direct call failed:",e)}}}function Te(){document.querySelectorAll(".editable-field").forEach(t=>{t.addEventListener("dblclick",function(){J(this)})})}function J(t){const e=t.textContent;t.dataset.field;const n=document.createElement("input");n.type="text",n.value=e,n.className="editable-input";const s=document.createElement("button");s.textContent="Save",s.className="btn-save",s.onclick=()=>V(t,n,s,o);const o=document.createElement("button");o.textContent="Cancel",o.className="btn-cancel",o.onclick=()=>cancelEdit(t,e,n,s,o),t.innerHTML="",t.appendChild(n),t.appendChild(s),t.appendChild(o),n.focus()}function V(t,e,n,s){const o=e.value,a=t.dataset.field,c=t.closest("tr");c.dataset.userId?updateUserField(c.dataset.userId,a,o,t):c.dataset.teacherId&&updateTeacherField(c.dataset.teacherId,a,o,t),n.remove(),s.remove(),e.remove(),t.textContent=o}function Se(){const t=document.getElementById("testsContainer"),e=document.querySelector('button[onclick="toggleTestsContent()"]');if(!t){console.error("❌ testsContainer not found");return}if(!e){console.error("❌ Button not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",K(),e.textContent="Hide Tests ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get All Tests ▶",e.classList.remove("active"))}function we(){const t=document.getElementById("assignmentsContainer"),e=document.querySelector('button[onclick="toggleAssignmentsContent()"]');if(!t){console.error("❌ assignmentsContainer not found");return}if(!e){console.error("❌ Button not found");return}const n=window.getComputedStyle(t).display;t.style.display==="none"||n==="none"?(t.style.display="block",Q(),e.textContent="Hide Assignments ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get Test Assignments ▶",e.classList.remove("active"))}function Ee(){console.log("🔧 toggleResultsContent called");const t=document.getElementById("resultsContainer"),e=document.querySelector('button[onclick="toggleResultsContent()"]');if(console.log("🔧 Container found:",t),console.log("🔧 Button found:",e),!t){console.error("❌ resultsContainer not found");return}if(!e){console.error("❌ Button not found");return}t.style.display==="none"||t.style.display===""?(t.style.display="block",W(),e.textContent="Hide Results ▼",e.classList.add("active")):(t.style.display="none",e.textContent="Get Test Results ▶",e.classList.remove("active"))}function Ce(){console.log("🔧 Testing all toggle functions..."),["usersSection","teachersSection","subjectsSection"].forEach(e=>{console.log(`🔧 Testing toggle for: ${e}`),i(e)})}function ke(){console.log("🔧 Manual toggle test called");const t="usersSection";document.getElementById(t)?(console.log(`🔧 Manually toggling section: ${t}`),i(t)):console.error(`❌ Section ${t} not found for manual test`)}async function K(){try{console.log("🔧 Getting all tests...");const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-all-tests")).json();e.success?X(e.tests):(console.error("Failed to get tests:",e.message),u("Failed to get tests: "+e.message,"error"))}catch(t){console.error("Error fetching tests:",t),u("Error fetching tests","error")}}async function Q(){try{console.log("🔧 Getting test assignments...");const e=await(await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-test-assignments")).json();e.success?Z(e.assignments):(console.error("Failed to get test assignments:",e.message),u("Failed to get test assignments: "+e.message,"error"))}catch(t){console.error("Error fetching test assignments:",t),u("Error fetching test assignments","error")}}async function W(){var t;try{console.log("🔧 Getting test results..."),console.log("Token manager available:",!!window.tokenManager),console.log("Token manager authenticated:",(t=window.tokenManager)==null?void 0:t.isAuthenticated());const e=await window.tokenManager.makeAuthenticatedRequest("/.netlify/functions/get-test-results");console.log("Test results response:",e),console.log("Test results response status:",e.status);const n=await e.json();console.log("Test results data:",n),n.success?(console.log("Test results loaded successfully, displaying table..."),ee(n.results)):(console.error("Failed to get test results:",n.message),u("Failed to get test results: "+n.message,"error"))}catch(e){console.error("Error fetching test results:",e),u("Error fetching test results","error")}}function X(t){const e=document.getElementById("testsContainer");if(!e){console.error("Tests container not found");return}e.innerHTML=`
    <table class="admin-table">
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Questions</th>
          <th>Created</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(n=>`
          <tr>
            <td>${n.id}</td>
            <td>${n.test_name}</td>
            <td>${n.test_type.replace("_"," ")}</td>
            <td>${n.num_questions||n.num_blocks||0}</td>
            <td>${new Date(n.created_at).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="editTest(${n.id})">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTest(${n.id})">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}function Z(t){const e=document.getElementById("assignmentsContainer");if(!e){console.error("Assignments container not found");return}e.innerHTML=`
    <table class="admin-table">
      <thead>
        <tr>
          <th>Assignment ID</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Grade</th>
          <th>Class</th>
          <th>Assigned</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(n=>`
          <tr>
            <td>${n.assignment_id}</td>
            <td>${n.test_name}</td>
            <td>${n.test_type.replace("_"," ")}</td>
            <td>M${n.grade}</td>
            <td>${n.grade}/${n.class}</td>
            <td>${new Date(n.assigned_at).toLocaleDateString()}</td>
            <td>
              <span class="text-muted">Use bulk deletion below</span>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `}function ee(t){console.log("displayTestResultsTable called with results:",t),console.log("Results type:",typeof t),console.log("Results length:",t==null?void 0:t.length);const e=document.getElementById("resultsContainer");if(!e){console.error("Results container not found");return}console.log("Results container found:",e),e.innerHTML=`
    <table class="admin-table">
      <thead>
        <tr>
          <th>Result ID</th>
          <th>Student Info</th>
          <th>Test Name</th>
          <th>Type</th>
          <th>Score</th>
          <th>Max Score</th>
          <th>Percentage</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>
        ${t.map(n=>{const s=n.score_percentage||Math.round(n.score/n.max_score*100);return`
          <tr>
            <td>${n.id}</td>
            <td>${n.student_name||"Unknown"} ${n.student_surname||""} (${n.student_id}) - #${n.student_number||"N/A"} - ${n.student_nickname||"No nickname"}</td>
            <td>${n.test_name}</td>
            <td>${n.test_type.replace("_"," ")}</td>
            <td>${n.score}</td>
            <td>${n.max_score}</td>
            <td>${s}%</td>
            <td>${new Date(n.submitted_at).toLocaleDateString()}</td>
          </tr>
        `}).join("")}
      </tbody>
    </table>
  `}const w=document.getElementById("debugFunctionsBtn");w&&w.addEventListener("click",showDebugFunctions);const E=document.getElementById("editSubjectsAdminBtn");E&&E.addEventListener("click",showAdminSubjectEditor);const C=document.getElementById("checkAcademicYearBtn");C&&C.addEventListener("click",F);async function je(){if(!await m()){console.error("No valid admin session found in loadAdminData, redirecting to login"),g("login-section");return}await A(),await v(),await k(),await j()}export{pe as A,be as B,Ce as C,ke as D,Te as E,J as F,V as G,ae as a,ce as b,le as c,re as d,ie as e,de as f,ue as g,se as h,me as i,ge as j,Se as k,je as l,we as m,Ee as n,he as o,U as p,S as q,ye as r,oe as s,ne as t,O as u,z as v,D as w,Y as x,i as y,fe as z};
