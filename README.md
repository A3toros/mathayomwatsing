# Mathayomwatsing School Testing System

A comprehensive web-based testing system for schools with Neon DB and Netlify hosting.

## Features

### 🎓 Student Features
- **Login System**: Students can log in using their Student ID and Number
- **Subject Viewing**: View assigned subjects and test results
- **Performance Tracking**: Track scores across different subjects and semesters
- **Responsive Interface**: Mobile-friendly design

### 👨‍🏫 Teacher Features
- **Subject Management**: Assign subjects to specific grades and classes
- **Test Creation**: Create multiple choice and free answer tests
- **Results Viewing**: View and analyze student performance by grade, class, and semester
- **Dashboard**: Comprehensive overview of assigned classes

### 🔧 Admin Features
- **User Management**: View all students, teachers, and subjects
- **Database Debugging**: Test database connections and view system data
- **Academic Year Management**: Monitor academic periods and terms
- **System Monitoring**: Comprehensive debugging tools

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Neon DB account
- Netlify account

### 1. Database Setup

1. **Create Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your connection string

2. **Run Database Schema**
   ```bash
   # Connect to your Neon database and run:
   psql "your-neon-connection-string"
   \i database_schema.sql
   ```

### 2. Local Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=your-neon-connection-string
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8888`

### 3. Deploy to Netlify

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Netlify**
   - Connect your Git repository to Netlify
   - Set the build command: `npm run build`
   - Set the publish directory: `public`
   - Add environment variable: `DATABASE_URL`

3. **Deploy**
   Netlify will automatically deploy your application

## 📊 Database Schema

### Core Tables
- **users**: Student information (217 students across 6 grades)
- **teachers**: Teacher credentials and information
- **subjects**: Available subjects (9 subjects)
- **academic_year**: Academic periods and terms
- **teacher_subjects**: Teacher-subject-class assignments

### Test Tables
- **multiple_choice_tests**: Multiple choice test definitions
- **true_false_tests**: True/false test definitions
- **input_tests**: Free answer test definitions
- **test_questions**: Individual test questions
- **test_results**: Student test results

## 🔐 Login Credentials

### Students
- **Student ID**: Use the student ID from the database (e.g., 51706)
- **Password**: Use the student's number (e.g., 1)

### Teachers
- **Username**: Alex or Charlie
- **Password**: 465

### Admin
- **Username**: admin
- **Password**: maxpower

## 🛠️ API Endpoints

### Authentication
- `POST /.netlify/functions/student-login` - Student login
- `POST /.netlify/functions/teacher-login` - Teacher login
- `POST /.netlify/functions/admin-login` - Admin login

### Student Management
- `GET /.netlify/functions/get-student-subjects` - Get student subjects
- `GET /.netlify/functions/get-student-test-results` - Get student test results

### Teacher Management
- `GET /.netlify/functions/get-subjects` - Get all subjects
- `POST /.netlify/functions/save-teacher-subjects` - Save teacher subject assignments
- `GET /.netlify/functions/get-teacher-subjects` - Get teacher subjects
- `GET /.netlify/functions/get-class-results` - Get class results

### Test Management
- `POST /.netlify/functions/save-multiple-choice-test` - Save multiple choice test
- `POST /.netlify/functions/save-input-test` - Save input test

### Admin Management
- `GET /.netlify/functions/get-all-users` - Get all users
- `GET /.netlify/functions/get-all-teachers` - Get all teachers
- `GET /.netlify/functions/get-all-subjects` - Get all subjects
- `GET /.netlify/functions/get-academic-year` - Get academic year data
- `GET /.netlify/functions/test-db-connection` - Test database connection

## 🎨 Customization

### Styling
- Modify `public/styles.css` for custom styling
- The system uses a modern, responsive design with CSS Grid and Flexbox

### Functionality
- Add new test types in the `functions/` directory
- Extend the database schema as needed
- Modify the frontend JavaScript in `public/script.js`

## 📱 Responsive Design

The system is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones
- All modern browsers

## 🔒 Security Features

- Input validation on all forms
- SQL injection prevention using parameterized queries
- CORS configuration for API endpoints
- Secure password handling

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check your `DATABASE_URL` environment variable
   - Verify your Neon database is running
   - Test connection using the debug function

2. **Functions Not Working**
   - Ensure all dependencies are installed
   - Check Netlify function logs
   - Verify function names match the frontend calls

3. **Build Errors**
   - Check Node.js version compatibility
   - Verify all required files are present
   - Check for syntax errors in JavaScript files

### Debug Tools

Use the admin panel's debug functions to:
- Test database connections
- View system data
- Monitor API responses

## 📈 Performance

- **Database**: Optimized queries with proper indexing
- **Frontend**: Efficient DOM manipulation and event handling
- **API**: Fast response times with proper error handling
- **Caching**: Browser-based caching for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Test with the debug functions
- Contact the development team

## 🔄 Updates

The system is designed to be easily updatable:
- Database migrations can be applied incrementally
- New features can be added as new functions
- Frontend updates can be deployed independently

---

**Built with ❤️ for Mathayomwatsing School**
