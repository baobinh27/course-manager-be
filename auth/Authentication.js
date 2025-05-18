class Authentication {
    constructor(user) {
        this.user = user; // Thông tin người dùng từ req.user (sau khi xác thực)
    }
    isLoggedIn() {
        return Boolean(this.user);
    }
    
      // Kiểm tra role admin
    isAdmin() {
        return this.user?.role === 'admin';
    }

        // Check User ? creator of course
    isCourseCreator(course) {
        if (!this.user || !course.userId) return false;
        return course.userId.toString() === this.user._id.toString();
    }

        // Check User ? creator of draft course
    isDraftCourseCreator(draftCourse) {
        if (!this.user) return false;
        return draftCourse.userId.toString() === this.user._id.toString();
    }
        // Check User ? Enrolled in course
    isEnrolled(courseId) {
        if (!this.user) return false;
        const enrolledCourseIds = this.user.ownedCourses.map(c => c.courseId.toString());
        return enrolledCourseIds.includes(courseId.toString());
    }

// Check User ? Admin
//      isAdmin() {
//          return this.user && this.user.role === "admin";
//      }

// canViewCourse(course) {
//          // Giả định: Tất cả khóa học đều công khai, ai cũng có thể xem
//          return true;
// }

// // Kiểm tra quyền xem danh sách tất cả khóa học
// canViewAllCourses() {
//          // Tương tự, giả định tất cả khóa học đều công khai
//          return true;
// }

// Check User ? can enroll/view created course/ view enrolled course   // logined user
};

module.exports = Authentication;