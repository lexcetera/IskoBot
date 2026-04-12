# 🎓 UP Diliman Freshies Discord Bot

A Discord bot designed to help incoming students of the University of the Philippines Diliman connect with their classmates, organize schedules, and build a stronger community before classes even begin.

---

## ✨ Features

### 👤 User System
- Stores user ID and username
- Keeps track of each user's enrolled classes

---

### 📚 Class Management
Users can manage their own class schedules easily.

#### Commands:
- `/addclass <course> <schedule>`  
  ➤ Add a class to your list  

- `/removeclass <course> <schedule>`  
  ➤ Remove a class from your list  

- `/myclasses`  
  ➤ View all your registered classes  

---

### 🤝 Classmate Finder
Easily find and connect with people in the same classes.

#### Features:
- Automatically creates a **channel per class & schedule**
- Adds students to the correct class channel
- Sends a welcome ping when someone new joins your class

#### Commands:
- `/findclassmate`  
  ➤ Show users who share the same classes as you (grouped per class)

- `/findclassmate <class>`  
  ➤ Show users in a specific class  

- `/findcourse`  
  ➤ Show all users taking a specific course  

---

## Installation 

### 1. Clone the repository.

### 2. Install the dependencies.

### 3. Set up Environment Variables.

## Known Bugs 

# 1. Does not create the class channels.

# 2. Formatting is not yet added. Math 21 is separate from math 21. 