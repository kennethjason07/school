import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://dmagnsbdjsnzsddxqrwd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtYWduc2JkanNuenNkZHhxcndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTQ2MTEsImV4cCI6MjA2ODIzMDYxMX0.VAo64FAcg1Mo4qA22FWwC7Kdq6AAiLTNeBOjFB9XTi8';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names matching your schema
export const TABLES = {
  USERS: 'users',
  ROLES: 'roles',
  CLASSES: 'classes',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  SUBJECTS: 'subjects',
  TEACHER_SUBJECTS: 'teacher_subjects',
  STUDENT_ATTENDANCE: 'student_attendance',
  TEACHER_ATTENDANCE: 'teacher_attendance',
  FEE_STRUCTURE: 'fee_structure',
  STUDENT_FEES: 'student_fees',
  EXAMS: 'exams',
  MARKS: 'marks',
  HOMEWORKS: 'homeworks',
  HOMEWORK: 'homeworks',
  ASSIGNMENTS: 'assignments',
  TIMETABLE_ENTRIES: 'timetable_entries',
  NOTIFICATIONS: 'notifications',
  MESSAGES: 'messages',
  TASKS: 'tasks',
  PERSONAL_TASKS: 'personal_tasks',
  SCHOOL_DETAILS: 'school_details',
  MESSAGES: 'messages',
};

// Authentication helper functions
export const authHelpers = {
  // Sign up a new user
  async signUp(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helper functions
export const dbHelpers = {
  // Generic CRUD operations
  async create(table, data) {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();
      return { data: result, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async read(table, filters = {}) {
    try {
      let query = supabase.from(table).select('*');
      
      // Apply filters
      Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
      });
      
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async update(table, id, updates) {
    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async delete(table, id) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // User management functions
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createUser(userData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert(userData)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Class and Section management
  async getClasses() {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select(`
          *,
          teachers!classes_class_teacher_id_fkey(name)
        `)
        .order('class_name');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getSectionsByClass(classId = null) {
    try {
      let query = supabase
        .from(TABLES.CLASSES)
        .select('section');

      if (classId) {
        query = query.eq('id', classId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Extract unique sections
      const uniqueSections = [...new Set(data.map(item => item.section))];
      return { data: uniqueSections.map(s => ({ id: s, section_name: s })), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getClassById(classId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .select(`
          *,
          teachers!classes_class_teacher_id_fkey(name)
        `)
        .eq('id', classId)
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createClass(classData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .insert(classData)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateClass(classId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.CLASSES)
        .update(updates)
        .eq('id', classId)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteClass(classId) {
    try {
      const { error } = await supabase
        .from(TABLES.CLASSES)
        .delete()
        .eq('id', classId);
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Student management
  async getStudentsByClass(classId, sectionId = null) {
    try {
      let query = supabase
        .from(TABLES.STUDENTS)
        .select(`
          *,
          classes(class_name, section),
          parents(full_name, phone, email)
        `)
        .eq('class_id', classId);
      
      if (sectionId) {
        query = query.eq('classes.section', sectionId);
      }
      
      const { data, error } = await query.order('roll_no');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getStudentById(studentId) {
    try {
      console.log('getStudentById: Fetching student with ID:', studentId);

      // First try a simple query without joins
      const { data: basicData, error: basicError } = await supabase
        .from(TABLES.STUDENTS)
        .select('*')
        .eq('id', studentId)
        .single();

      if (basicError) {
        console.error('getStudentById: Basic query failed:', basicError);
        return { data: null, error: basicError };
      }

      console.log('getStudentById: Basic student data:', basicData);

      // Try to get class info separately
      let classData = null;
      if (basicData.class_id) {
        const { data: classInfo, error: classError } = await supabase
          .from(TABLES.CLASSES)
          .select('class_name, section')
          .eq('id', basicData.class_id)
          .single();

        if (!classError) {
          classData = classInfo;
        } else {
          console.warn('getStudentById: Class query failed:', classError);
        }
      }

      // Try to get parent info separately
      let parentData = null;
      if (basicData.parent_id) {
        const { data: parentInfo, error: parentError } = await supabase
          .from(TABLES.USERS)
          .select('full_name, phone, email')
          .eq('id', basicData.parent_id)
          .single();

        if (!parentError) {
          parentData = parentInfo;
        } else {
          console.warn('getStudentById: Parent query failed:', parentError);
        }
      }

      // Combine the data
      const combinedData = {
        ...basicData,
        classes: classData,
        users: parentData
      };

      console.log('getStudentById: Combined data:', combinedData);
      return { data: combinedData, error: null };

    } catch (error) {
      console.error('getStudentById: Unexpected error:', error);
      return { data: null, error };
    }
  },

  async getAllStudents() {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .select(`
          *,
          classes(class_name, section),
          users!students_parent_id_fkey(full_name, phone, email)
        `)
        .order('created_at', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createStudent(studentData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .insert(studentData)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async updateStudent(studentId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDENTS)
        .update(updates)
        .eq('id', studentId)
        .select()
        .single();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async deleteStudent(studentId) {
    try {
      const { error } = await supabase
        .from(TABLES.STUDENTS)
        .delete()
        .eq('id', studentId);
      return { error };
    } catch (error) {
      return { error };
    }
  },

  async getStudentAttendance(studentId, startDate = null, endDate = null) {
    try {
      // Validate student ID before making database query
      if (!isValidUUID(studentId)) {
        console.log('dbHelpers.getStudentAttendance - Invalid student ID:', studentId);
        return { data: [], error: null };
      }

      let query = supabase
        .from(TABLES.STUDENT_ATTENDANCE)
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.log('dbHelpers.getStudentAttendance - Database error:', error);
        return { data: [], error: null }; // Return empty data instead of error
      }

      return { data, error };
    } catch (error) {
      console.log('dbHelpers.getStudentAttendance - Catch error:', error);
      return { data: [], error: null }; // Return empty data instead of error
    }
  },

  // Teacher management
  async getTeachers() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEACHERS)
        .select('*')
        .order('name');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getTeacherSubjects(teacherId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEACHER_SUBJECTS)
        .select(`
          *,
          subjects(id, name, class_id)
        `)
        .eq('teacher_id', teacherId);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Attendance management
  async getAttendanceByDate(date, classId = null, sectionId = null) {
    try {
      let query = supabase
        .from(TABLES.STUDENT_ATTENDANCE)
        .select(`
          *,
          students(
            full_name,
            roll_no,
            classes(class_name, section)
          )
        `)
        .eq('date', date);
      
      if (classId) {
        query = query.eq('students.class_id', classId);
      }
      
      if (sectionId) {
        query = query.eq('students.classes.section', sectionId);
      }
      
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async markAttendance(attendanceData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.STUDENT_ATTENDANCE)
        .upsert(attendanceData, { onConflict: 'student_id,date' })
        .select();
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Fee management
  async getFeeStructure(classId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.FEE_STRUCTURE)
        .select('*')
        .eq('class_id', classId);
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getStudentFees(studentId) {
    try {
      console.log('getStudentFees: Fetching fees for student ID:', studentId);

      // First try a simple query without joins
      const { data, error } = await supabase
        .from(TABLES.STUDENT_FEES)
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      console.log('getStudentFees: Query result:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('getStudentFees: Unexpected error:', error);
      return { data: null, error };
    }
  },

  // Timetable management
  async getTeacherTimetable(teacherId, academicYear = null) {
    try {
      // If no academic year provided, use current year
      if (!academicYear) {
        const currentYear = new Date().getFullYear();
        academicYear = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;
      }

      const { data, error } = await supabase
        .from(TABLES.TIMETABLE)
        .select(`
          *,
          classes(class_name, section),
          subjects(subject_name)
        `)
        .eq('teacher_id', teacherId)
        .eq('academic_year', academicYear)
        .order('day_of_week')
        .order('period_number');

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Exam and Marks management
  async getExams(classId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.EXAMS)
        .select('*')
        .eq('class_id', classId)
        .order('date', { ascending: false });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getMarksByStudent(studentId, examId = null) {
    try {
      let query = supabase
        .from(TABLES.MARKS)
        .select(`
          *,
          exams(name, date),
          subjects(name)
        `)
        .eq('student_id', studentId);
      
      if (examId) {
        query = query.eq('exam_id', examId);
      }
      
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Homework management
  async getHomeworks(classId, sectionId = null) {
    try {
      let query = supabase
        .from(TABLES.HOMEWORKS)
        .select(`
          *,
          subjects(name),
          teachers(full_name),
          classes(section)
        `)
        .eq('class_id', classId);
      
      if (sectionId) {
        query = query.eq('classes.section', sectionId);
      }
      
      const { data, error } = await query.order('due_date');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Timetable management
  async getTimetable(classId, sectionId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.TIMETABLE)
        .select(`
          *,
          subjects(name),
          teachers(full_name),
          classes(section)
        `)
        .eq('class_id', classId)
        .eq('classes.section', sectionId)
        .order('day_of_week, start_time');
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Notifications
  async getNotificationsByRole(role, userId = null) {
    try {
      let query = supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('sent_to_role', role)
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('sent_to_id', userId);
      }
      
      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getTasks() {
    try {
      const { data, error } = await supabase
        .from(TABLES.TASKS)
        .select('*')
        .order('due_date', { ascending: true });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get parent data by user ID
  async getParentByUserId(userId) {
    try {
      // First get the parent user data
      const { data: parentUser, error: parentError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .eq('role', 'parent')
        .single();

      if (parentError || !parentUser) {
        return { data: null, error: parentError || new Error('Parent user not found') };
      }

      // Then get the students associated with this parent
      const { data: students, error: studentsError } = await supabase
        .from(TABLES.STUDENTS)
        .select(`
          id,
          name,
          admission_no,
          roll_no,
          class_id,
          academic_year,
          classes (
            id,
            class_name,
            section,
            academic_year
          )
        `)
        .eq('parent_id', userId);

      if (studentsError) {
        return { data: null, error: studentsError };
      }

      // Combine parent data with students
      const result = {
        ...parentUser,
        students: students || []
      };

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create sample parent and student data for testing
  async createSampleParentData(userId) {
    try {
      // First, check if user exists and update role to parent
      const { data: existingUser, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !existingUser) {
        return { data: null, error: new Error('User not found') };
      }

      // Update user role to parent if not already
      if (existingUser.role !== 'parent') {
        const { error: updateError } = await supabase
          .from(TABLES.USERS)
          .update({ role: 'parent' })
          .eq('id', userId);

        if (updateError) {
          return { data: null, error: updateError };
        }
      }

      // Create a sample class if none exists
      let { data: existingClass } = await supabase
        .from(TABLES.CLASSES)
        .select('*')
        .limit(1)
        .single();

      if (!existingClass) {
        const { data: newClass, error: classError } = await supabase
          .from(TABLES.CLASSES)
          .insert({
            class_name: '10th',
            section: 'A',
            academic_year: '2024-2025'
          })
          .select()
          .single();

        if (classError) {
          return { data: null, error: classError };
        }
        existingClass = newClass;
      }

      // Create a sample student linked to this parent
      const { data: existingStudent } = await supabase
        .from(TABLES.STUDENTS)
        .select('*')
        .eq('parent_id', userId)
        .single();

      if (!existingStudent) {
        const { data: newStudent, error: studentError } = await supabase
          .from(TABLES.STUDENTS)
          .insert({
            admission_no: `ADM${Date.now()}`,
            name: 'Sample Student',
            dob: '2008-01-01',
            gender: 'Male',
            academic_year: '2024-2025',
            roll_no: Math.floor(Math.random() * 100) + 1,
            parent_id: userId,
            class_id: existingClass.id,
            address: 'Sample Address',
            nationality: 'Indian'
          })
          .select()
          .single();

        if (studentError) {
          return { data: null, error: studentError };
        }

        return { data: { message: 'Sample data created successfully', student: newStudent }, error: null };
      }

      return { data: { message: 'Sample data already exists' }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get parent data by user ID
  async getParentByUserId(userId) {
    try {
      // First get the parent user data with role information
      const { data: parentUser, error: parentError } = await supabase
        .from(TABLES.USERS)
        .select(`
          *,
          roles (
            id,
            role_name
          )
        `)
        .eq('id', userId)
        .single();

      if (parentError || !parentUser) {
        return { data: null, error: parentError || new Error('Parent user not found') };
      }

      // Check if user has parent role (assuming role_name 'parent' or role_id for parent)
      const isParent = parentUser.roles?.role_name === 'parent' ||
                      parentUser.role_id === 3 || // Assuming 3 is parent role ID
                      parentUser.linked_parent_of; // Has a linked student

      if (!isParent) {
        return { data: null, error: new Error('User is not a parent') };
      }

      // Get the student this parent is linked to
      let students = [];

      if (parentUser.linked_parent_of) {
        // Get the specific student this parent is linked to
        const { data: linkedStudent, error: studentError } = await supabase
          .from(TABLES.STUDENTS)
          .select(`
            id,
            name,
            admission_no,
            roll_no,
            class_id,
            academic_year,
            classes (
              id,
              class_name,
              section,
              academic_year
            )
          `)
          .eq('id', parentUser.linked_parent_of)
          .single();

        if (!studentError && linkedStudent) {
          students = [linkedStudent];
        }
      } else {
        // Fallback: try to find students by parent_id if that field exists
        const { data: studentsByParentId, error: studentsError } = await supabase
          .from(TABLES.STUDENTS)
          .select(`
            id,
            name,
            admission_no,
            roll_no,
            class_id,
            academic_year,
            classes (
              id,
              class_name,
              section,
              academic_year
            )
          `)
          .eq('parent_id', userId);

        if (!studentsError && studentsByParentId) {
          students = studentsByParentId;
        }
      }

      // Combine parent data with students
      const result = {
        ...parentUser,
        students: students || []
      };

      console.log('=== getParentByUserId DEBUG ===');
      console.log('Parent user data:', JSON.stringify(parentUser, null, 2));
      console.log('Students data:', JSON.stringify(students, null, 2));
      console.log('Final result summary:', {
        parentUserId: parentUser.id,
        studentsCount: students?.length || 0,
        studentsData: students?.map(s => ({
          id: s.id,
          name: s.name,
          class_id: s.class_id,
          allKeys: Object.keys(s)
        }))
      });
      console.log('=== END getParentByUserId DEBUG ===');

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create sample parent and student data for testing
  async createSampleParentData(userId) {
    try {
      // First, check if user exists and update role to parent
      const { data: existingUser, error: userError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !existingUser) {
        return { data: null, error: new Error('User not found') };
      }

      // Update user role to parent if not already (role_id 3 for parent)
      if (existingUser.role_id !== 3 && !existingUser.linked_parent_of) {
        // First, ensure parent role exists in roles table
        const { data: parentRole, error: roleError } = await supabase
          .from(TABLES.ROLES)
          .select('id')
          .eq('role_name', 'parent')
          .single();

        let parentRoleId = 3; // Default assumption
        if (!roleError && parentRole) {
          parentRoleId = parentRole.id;
        } else {
          // Create parent role if it doesn't exist
          const { data: newRole, error: createRoleError } = await supabase
            .from(TABLES.ROLES)
            .insert({ role_name: 'parent' })
            .select('id')
            .single();

          if (!createRoleError && newRole) {
            parentRoleId = newRole.id;
          }
        }

        const { error: updateError } = await supabase
          .from(TABLES.USERS)
          .update({ role_id: parentRoleId })
          .eq('id', userId);

        if (updateError) {
          return { data: null, error: updateError };
        }
      }

      // Create a sample class if none exists
      let { data: existingClass } = await supabase
        .from(TABLES.CLASSES)
        .select('*')
        .limit(1)
        .single();

      if (!existingClass) {
        const { data: newClass, error: classError } = await supabase
          .from(TABLES.CLASSES)
          .insert({
            class_name: '10th',
            section: 'A',
            academic_year: '2024-2025'
          })
          .select()
          .single();

        if (classError) {
          return { data: null, error: classError };
        }
        existingClass = newClass;
      }

      // Create a sample student and link to this parent
      const { data: existingStudent } = await supabase
        .from(TABLES.STUDENTS)
        .select('*')
        .or(`parent_id.eq.${userId},id.eq.${existingUser.linked_parent_of}`)
        .single();

      if (!existingStudent) {
        const { data: newStudent, error: studentError } = await supabase
          .from(TABLES.STUDENTS)
          .insert({
            admission_no: `ADM${Date.now()}`,
            name: 'Sample Student',
            dob: '2008-01-01',
            gender: 'Male',
            academic_year: '2024-2025',
            roll_no: Math.floor(Math.random() * 100) + 1,
            parent_id: userId, // If parent_id field exists
            class_id: existingClass.id,
            address: 'Sample Address',
            nationality: 'Indian'
          })
          .select()
          .single();

        if (studentError) {
          return { data: null, error: studentError };
        }

        // Update user to link to this student
        const { error: linkError } = await supabase
          .from(TABLES.USERS)
          .update({ linked_parent_of: newStudent.id })
          .eq('id', userId);

        if (linkError) {
          console.warn('Failed to link parent to student:', linkError);
        }

        return { data: { message: 'Sample data created successfully', student: newStudent }, error: null };
      }

      return { data: { message: 'Sample data already exists' }, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Dashboard statistics
  async getDashboardStats() {
    try {
      const [
        { data: students, error: studentsError },
        { data: teachers, error: teachersError },
        { data: classes, error: classesError },
        { data: todayAttendance, error: attendanceError }
      ] = await Promise.all([
        supabase.from(TABLES.STUDENTS).select('id', { count: 'exact' }),
        supabase.from(TABLES.TEACHERS).select('id', { count: 'exact' }),
        supabase.from(TABLES.CLASSES).select('id', { count: 'exact' }),
        supabase.from(TABLES.STUDENT_ATTENDANCE)
          .select('id', { count: 'exact' })
          .eq('date', new Date().toISOString().split('T')[0])
          .eq('status', 'present')
      ]);

      return {
        data: {
          totalStudents: students?.length || 0,
          totalTeachers: teachers?.length || 0,
          totalClasses: classes?.length || 0,
          todayAttendance: todayAttendance?.length || 0
        },
        error: studentsError || teachersError || classesError || attendanceError
      };
    } catch (error) {
      return { data: null, error };
    }
  },
};

export default supabase; 