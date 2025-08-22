
// Get URL parameters
        function getURLParameters() {
            const urlParams = new URLSearchParams(window.location.search);
            return {
                collegeId: urlParams.get('collegeId'),
                user1Id: urlParams.get('user1Id'),
                branch: urlParams.get('branch')
            };
        }

        // Update dashboard content based on URL parameters
        function updateDashboardContent() {
            const params = getURLParameters();
            
            if (params.collegeId || params.user1Id || params.branch) {
                let subtitle = 'CSPDCL Vocational Training Online Exam System';
                
                if (params.collegeId) {
                    subtitle += ` - College: ${params.collegeId}`;
                }
                if (params.branch) {
                    subtitle += ` - Branch: ${params.branch}`;
                }
                if (params.user1Id) {
                    subtitle += ` - ID: ${params.user1Id}`;
                }
                
                document.getElementById('dashboardSubtitle').textContent = subtitle;
            }
        }

        window.addEventListener('load', function() {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (!token || user.role !== 'student') {
                window.location.href = '/login';
                return;
            }
            
            // Display user name
            document.getElementById('userName').textContent = user.fullName || 'Student';
            
            // Update dashboard content based on URL parameters
            updateDashboardContent();
            
            // Load user profile
            loadProfile();
            
            // Load recent activity
            loadRecentActivity();
        });
        
        async function loadProfile() {
            const token = localStorage.getItem('token');
            
            try {
                const response = await fetch('/api/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const user = await response.json();
                    document.getElementById('userName').textContent = user.fullName;
                } else {
                    console.error('Failed to load profile');
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            }
        }

        async function loadRecentActivity() {
            const recentActivityContainer = document.getElementById('recentActivity');
            
            // Simulate loading recent activity
            setTimeout(() => {
                recentActivityContainer.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>No recent activity found</span>
                        <small class="text-muted">Today</small>
                    </div>
                `;
            }, 1000);
        }
        
        function startExamWithId() {
            const examId = document.getElementById('examIdInput').value.trim();
            
            if (!examId) {
                alert('Please enter an exam ID before starting the exam.');
                return;
            }
            
            // Validate exam ID format (you can customize this validation)
            if (examId.length < 3) {
                alert('Please enter a valid exam ID.');
                return;
            }
            
            // Start proctoring features
            startExam();
            
            // Redirect to exam page with the entered exam ID
            setTimeout(() => {
                window.location.href = `/student-exam.html?examId=${examId}`;
            }, 1000);
        }
        
        function viewResults() {
            alert('Results module will be implemented in the next phase');
        }
        
        function viewProfile() {
            alert('Profile module will be implemented in the next phase');
        }
        
        function logout() {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        
        function startExam() {
            // Fullscreen
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.log('Fullscreen request failed:', err);
                });
            }

            // Webcam
            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    const webcamElement = document.getElementById("webcam");
                    if (webcamElement) {
                        webcamElement.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.log('Camera access failed:', err);
                    alert('Camera access is required for exam proctoring.');
                });

            // Tab switch detection
            let violations = 0;
            const handleVisibilityChange = () => {
                if (document.hidden) {
                    violations++;
                    alert(`Tab switch detected (${violations}/3).`);
                    if (violations >= 3) {
                        alert("Too many violations. Exam will be submitted.");
                        submitExam();
                    }
                }
            };
            
            document.addEventListener("visibilitychange", handleVisibilityChange);

            // Fullscreen exit detection
            const handleFullscreenChange = () => {
                if (!document.fullscreenElement) {
                    alert("Fullscreen exited! Please return immediately.");
                }
            };
            
            document.addEventListener("fullscreenchange", handleFullscreenChange);
        }

        function submitExam() {
            // Implementation for submitting exam
            console.log('Exam submitted due to violations');
            // You can add your exam submission logic here
        }

        // Allow Enter key to start exam
        document.addEventListener('DOMContentLoaded', function() {
            const examIdInput = document.getElementById('examIdInput');
            if (examIdInput) {
                examIdInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        startExamWithId();
                    }
                });
            }
        });
