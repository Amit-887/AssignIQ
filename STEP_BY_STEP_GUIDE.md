# 🎓 Step-by-Step Guide: Assignment System

## 📍 **EXACTLY WHERE TO FIND EVERYTHING**

---

## 👨‍🏫 **FOR TEACHERS**

### **Step 1: Login as Teacher**
1. Go to: `http://localhost:3000/login`
2. Login with: `admin@assigniq.com` / `admin123`
3. You'll be redirected to **Teacher Dashboard**

### **Step 2: Create a Section (Class)**
1. **On Teacher Dashboard** → Look for **"Create Section"** card
2. Click the card → Dialog opens
3. Enter:
   - **Section Name**: e.g., "Computer Science 101"
   - **Description**: e.g., "Introduction to Programming"
4. Click **"Create"**

### **Step 3: Add Students to Your Section**
1. **On Teacher Dashboard** → Look for **"Your Sections"** box
2. Click **"Manage"** button (or go to `/sections`)
3. Find your section → Click **"Add Students"**
4. Enter student emails (one per line)
5. Click **"Add Students"**

### **Step 4: Create Assignment with Topic**
1. **On Teacher Dashboard** → Look for **"Create Assignment"** card
2. Click the card → Dialog opens
3. Fill in:
   - **Title**: e.g., "Python Basics Assignment"
   - **Section**: Select your class
   - **Description**: "Write a Python program that..."
   - **Due Date**: Pick date and time
   - **Max Marks**: e.g., 100
4. Click **"Create Assignment"**

### **Step 5: View All Student Submissions**
1. **On Teacher Dashboard** → Click **"View All"** under "Recent Submissions"
2. **OR** go to: `/assignments/:sectionId` (replace :sectionId with your section ID)
3. You'll see:
   - 📊 **All assignments** in your section
   - 👥 **Student submissions** with names
   - ✅ **Who submitted** vs **who didn't**
   - 📈 **Performance scores** (9/10 format)

### **Step 6: Check Student Performance**
1. **Click on any assignment** → Go to **"Submissions"** tab
2. **Click 👁️ View Details** on any student
3. You'll see:
   - 📁 **Uploaded files** (downloadable)
   - 🎯 **Score** (e.g., 8/10)
   - 🤖 **AI Analysis** (originality, plagiarism)
   - 📝 **Student answers** to AI questions
   - 💬 **Performance feedback**

---

## 👨‍🎓 **FOR STUDENTS**

### **Step 1: Login as Student**
1. Go to: `http://localhost:3000/login`
2. Login with student credentials
3. You'll be redirected to **Student Dashboard**

### **Step 2: Join a Section (if not already)**
1. **On Student Dashboard** → Look for **"My Sections"**
2. If no sections, click **"Join Section"**
3. Enter **Join Code** from your teacher
4. Click **"Join"**

### **Step 3: Find and Submit Assignment**
1. **On Student Dashboard** → Look for **"Pending Tasks"**
2. **Click on any assignment** to view details
3. **OR** go to: `/assignments/:sectionId` (your section)
4. **Click "Submit Assignment"** button

### **Step 4: Upload Document/Files**
1. **In submission dialog** → Click **"Upload Files"**
2. **Choose file types**:
   - 📄 PDF documents
   - 📝 Word documents (DOC, DOCX)
   - 📱 Photos (JPG, PNG) - use phone camera
3. **OR click "Take Photo"** to capture with mobile
4. **Add text content** in the text box (optional)
5. **Click "Precheck with AI"** (recommended)

### **Step 5: AI Precheck (Before Final Submission)**
1. **After uploading** → Click **"Precheck with AI"**
2. **Review results**:
   - ✅ **Originality Score** (higher is better)
   - ⚠️ **Plagiarism Risk** (lower is better)
   - 🤖 **AI Content** detection
   - 💡 **Suggestions** for improvement
3. **Fix any issues** based on feedback
4. **Click "Submit Assignment"**

### **Step 6: Answer AI Questions**
1. **After submission** → AI generates 5 questions
2. **Answer each question** to show understanding
3. **Click "Submit Answers"**
4. **See your score** immediately!

### **Step 7: View Your Performance**
1. **Go to "My Performance"** tab
2. **See**:
   - 📊 **Overall average score**
   - 📈 **Individual assignment scores**
   - ✅ **On-time submission rate**
   - 🎯 **Originality metrics**

---

## 🎯 **QUICK NAVIGATION CHEATSHEET**

### **Teacher Routes:**
- **Dashboard**: `/dashboard`
- **Create Section**: Click card on dashboard
- **Create Assignment**: Click card on dashboard  
- **View Submissions**: `/assignments/:sectionId`
- **Manage Sections**: `/sections`

### **Student Routes:**
- **Dashboard**: `/dashboard`
- **View Assignments**: `/assignments/:sectionId`
- **Join Section**: `/student-sections`
- **My Performance**: "My Performance" tab in assignments

---

## 📱 **MOBILE FEATURES**

### **For Students (Mobile Phone):**
1. **Open browser** → Go to `http://localhost:3000`
2. **Login** as student
3. **Go to assignments** → Click submission
4. **Click "Take Photo"** → Use phone camera
5. **Capture handwritten work** → Upload automatically
6. **Complete submission** → Same as desktop

---

## 🔍 **TROUBLESHOOTING**

### **"I don't see the assignment feature!"**
1. **Make sure you're logged in** with correct role
2. **Teachers**: Look for "Create Assignment" card on dashboard
3. **Students**: Make sure you're enrolled in a section
4. **Check if section exists**: Teacher must create section first

### **"Students can't submit!"**
1. **Teacher must create assignment** first
2. **Students must join section** with join code
3. **Assignment must have due date** in future
4. **Check file size** (max 10MB)

### **"Can't see student submissions!"**
1. **Go to**: `/assignments/:sectionId`
2. **Click on assignment** → View "Submissions" tab
3. **Check if students submitted** (status shows)
4. **Click 👁️ View Details** for individual student

---

## 🎉 **COMPLETE WORKFLOW EXAMPLE**

### **Teacher Workflow:**
1. **Login** → Dashboard → **Create Section** → "Math 101"
2. **Add Students** → Enter student emails
3. **Create Assignment** → "Algebra Problems" → Due tomorrow
4. **Monitor Submissions** → Check who submitted/who didn't
5. **Review Performance** → Click 👁️ on each student → See scores

### **Student Workflow:**
1. **Login** → Dashboard → **Join Section** → Enter join code
2. **View Assignment** → "Algebra Problems" → Click submit
3. **Upload Photo** → Take picture of handwritten work
4. **AI Precheck** → Get feedback → Improve work
5. **Submit** → Answer AI questions → Get 8/10 score
6. **View Performance** → See your progress

---

## 🚀 **READY TO USE!**

**All features are working now! Just follow these exact steps:** 🎯

1. **Login as admin** → Create sections → Add students
2. **Create assignments** with topics and due dates  
3. **Students submit** with file upload and AI precheck
4. **Teachers review** submissions and performance
5. **Everyone sees** real-time scores and analytics!

**Your complete assignment system is live!** 🎓
