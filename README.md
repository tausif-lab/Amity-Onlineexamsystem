# Amity-Onlineexamsystem
For amity hackthone


 Project Title: Smart & Secure Online Exams

## Team Details
- **Team Name:** [Clever Codex]  
- **Team Members:**
  - [Tausif Khan] – [Team Leader, Backend]  
  - [Sourabh Chandrakar] – [Backend]  
  - [Divyanshu Sahu] – [UI/UX and research]  
  - [Member 4 Name] – [Role/Responsibility]  

## Problem Statement
> Online examinations often face challenges in maintaining academic integrity. Students may attempt to cheat using external resources, multiple devices, or by leaving the exam window. Existing solutions are either too complex, bandwidth-heavy, or not user-friendly.  

## Project Description
> Our project is a **web-based proctoring system** that ensures secure and smooth online examinations. The system uses a **webcam-based monitoring container** to capture video locally and employs **proctoring algorithms** to detect suspicious activities such as face absence, multiple people detection, or tab switching.  

### Key Features:
- **Webcam Integration** – Captures and displays live video feed in-browser and if eye contact or head movement is done for more than threshold time that it give alert of cheating.  
- **Proctoring Engine** – Detects anomalies like multiple faces, absence, or suspicious movements.  
**User-Friendly UI** – Simple exam interface with integrated monitoring. 
**Parent Dashboard**- Provide dashboard for parents for real time analysis of student.
**High Security **-User login through their email ID and password and no other user can access another account by changing the URL.
**Analysis of student**-Teacher can analyse the overall performance by the graphs which is plotted by the performance of user.
**Fair exam**- Detect tab switches and cursor movement for fair exams, if so happens then it costs as cheating
Automatic submission: after three warnings of cheating exam gets automatically submitted

## Tech Stack
- **Frontend:** HTML, CSS, Bootstrap  
- **Logic & Functionality:** JavaScript  
**Deployment:** Runs entirely in the browser (can be hosted on any web server)  
**Database** MongoDB

## Installation & Usage
1. **Clone the repository:**  
   ```bash
   git clone https://github.com/your-repo-link.git
2.Open the project folder.
3.Install dependencies
4. Run ‘npm run dev’ in terminal
5.Grant webcam permission when prompted.
6.Start the exam – webcam monitoring and proctoring will run automatically.

## Future Enhancements
Two step authentication via OTP
Run Offline: Adding PWA feature so that exam can run in low bandwidth
Integrate the Question bank for the Teachers feasibility with question level integration
