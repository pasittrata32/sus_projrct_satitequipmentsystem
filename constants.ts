import { Equipment, BookingStatus } from './types';

export const PROGRAMS = ['Thai Programme', 'English Programme', 'Kindergarten'];

export const THAI_CLASSES = [
  'P.1A TP', 'P.1B TP', 'P.2A TP', 'P.2B TP', 'P.3A TP', 'P.3B TP',
  'P.4A TP', 'P.4B TP', 'P.5A TP', 'P.5B TP', 'P.6A TP', 'P.6B TP',
  'M.1A TP', 'M.1B TP', 'M.2A TP', 'M.2B TP', 'M.3A TP', 'M.3B TP',
  'M.4A TP', 'M.5A TP', 'M.6A TP'
];

export const ENGLISH_CLASSES = [
  'P.1A EP', 'P.1B EP', 'P.2A EP', 'P.2B EP', 'P.3A EP', 'P.3B EP',
  'P.4A EP', 'P.4B EP', 'P.5A EP', 'P.5B EP', 'P.6A EP', 'P.6B EP',
  'M.1A EP', 'M.1B EP', 'M.2A EP', 'M.2B EP', 'M.3A EP', 'M.3B EP',
  'M.4A EP', 'M.5A EP', 'M.6A EP'
];

export const KINDERGARTEN_CLASSES = [
  'K.1A TP', 'K.1B TP', 'K.2A TP', 'K.2B TP', 'K.3A TP', 'K.3B TP',
  'K.1A EP', 'K.1B EP', 'K.2A EP', 'K.2B EP', 'K.3A EP', 'K.3B EP'
];

export const PERIODS = [
  { id: 1, time: '08:40–09:40' },
  { id: 2, time: '09:40–10:40' },
  { id: 3, time: '10:40–11:40' },
  { id: 4, time: '12:40–13:40' },
  { id: 5, time: '13:40–14:40' },
  { id: 6, time: '14:50–15:50' },
];

export const EQUIPMENT_LIST: Equipment[] = [
  { id: 'tv', name: 'โทรทัศน์ Smart TV (Smart TV)' },
  { id: 'remote', name: 'รีโมททีวี (TV Remote Control)' },
  { id: 'hdmi', name: 'สาย HDMI (HDMI Cable)' },
  { id: 'power', name: 'สายปลั๊กไฟ (Power Cable)' },
  { id: 'stand', name: 'ขาตั้งทีวี (TV Stand)' },
  { id: 'converter', name: 'อุปกรณ์แปลงสัญญาณ (Signal Converter)' },
];

export const ALL_STATUSES: BookingStatus[] = ['Booked', 'In Use', 'Awaiting Return', 'Returned', 'Cancelled'];

export const LOCALES = {
  en: {
    // General
    appName: 'Equipment System',
    toggleLanguage: 'ภาษาไทย',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    confirm: 'Confirm',
    error: 'Error',
    success: 'Success',
    actions: 'Actions',
    search: 'Search',
    exportLabel: 'Export',
    copyright: '© 2025 SATIT UDOMSEUKSA SCHOOL. All rights reserved.',

    // Login
    login: 'Login',
    username: 'Username',
    password: 'Password',
    loginFailed: 'Login failed. Please check your username and password.',
    loginSuccess: 'Login successful!',
    
    // Sidebar
    dashboard: 'Status Dashboard',
    booking: 'Book/Borrow Equipment',
    returnEquipment: 'Return Equipment',
    reports: 'Reports',
    userManagement: 'User Management',
    logout: 'Logout',
    adminBorrow: 'Borrow Equipment',
    bookingGrid: 'Booking Schedule',


    // Dashboard/Status
    status: 'Status',
    classroom: 'Classroom',
    period: 'Period',
    date: 'Date',
    available: 'Available',
    booked: 'Booked',
    inUse: 'In Use',
    awaitingReturn: 'Awaiting Return',
    returned: 'Returned',
    cancelled: 'Cancelled',
    equipmentStatus: 'Equipment Status',
    allPrograms: 'All Programs',
    searchClassroomPlaceholder: 'Filter by classroom name...',
    noClassroomsFound: 'No classrooms match the current filter.',
    updateStatus: 'Update Status',
    selectStatus: 'Select a status',
    noBookingsToday: 'No active bookings for the selected filter today.',
    
    // Booking Form
    bookingForm: 'Booking/Borrowing Form',
    bookingType: 'Type',
    book: 'Book',
    borrow: 'Borrow',
    teacherName: 'Teacher Name',
    program: 'Program',
    selectProgram: 'Select a program',
    selectClassroom: 'Select a classroom',
    selectTeacher: 'Select a teacher',
    selectPeriod: 'Select a period',
    usageDate: 'Usage Date',
    learningUnitNumber: 'Learning Unit No.',
    learningUnitName: 'Learning Unit Name',
    lessonPlanName: 'Lesson Plan Name',
    equipmentList: 'Equipment List',
    other: 'Other (Specify)',
    submitBooking: 'Submit Booking',
    bookingConflictTitle: 'Booking Conflict',
    bookingConflictText: 'This classroom is already booked for the selected date and period.',
    equipmentConflictTitle: 'Equipment Conflict',
    equipmentConflictText: 'Some of the selected equipment is already booked by another user for the selected time.',
    bookingSuccessTitle: 'Booking Successful!',
    bookingSuccessText: 'Your equipment booking has been confirmed.',
    formValidationError: 'Please fill in all required fields.',
    programThai: 'Thai Programme',
    programEnglish: 'English Programme',
    programKindergarten: 'Kindergarten',
    confirmDeleteBookingTitle: 'Confirm Deletion',
    confirmDeleteBookingText: 'Are you sure you want to delete this booking? This action is irreversible.',
    deleteBookingSuccess: 'Booking deleted successfully.',
    deleteBookingError: 'Failed to delete booking.',

    // Booking Schedule
    selectDate: 'Select Date',
    bookingSlotAvailable: 'Available',
    bookingSlotBooked: 'Booked',
    confirmCancelTitle: 'Confirm Booking Cancellation',
    confirmCancelText: 'This action will permanently cancel this booking. Are you sure you want to proceed?',
    confirmCancelAction: 'Yes, cancel booking',
    denyCancelAction: 'No, keep booking',
    cancelSuccessTitle: 'Booking Cancelled',
    cancelSuccessText: 'The booking has been successfully cancelled.',
    loadingActionText: 'Processing, please wait...',

    // Return Page & Dashboard
    returnEquipmentTitle: 'Equipment Return',
    pendingReturns: 'Pending Returns',
    noPendingReturns: 'No equipment is currently pending return.',
    teacher: 'Teacher',
    equipment: 'Equipment',
    markAsReturned: 'Mark as Returned',
    returnSuccess: 'Equipment marked as returned.',
    confirmReturn: 'Confirm Return',
    searchPendingReturnsPlaceholder: 'Search by teacher, classroom, or equipment...',

    // Reports Page
    reportsTitle: 'Usage Reports',
    exportToExcel: 'Export to Excel',
    startDate: 'Start Date',
    endDate: 'End Date',
    generateReport: 'Generate Report',
    searchReportPlaceholder: 'Search by borrower, lesson plan, equipment, or class...',
    reportHeaderSchool: 'Satit Udomseuksa School',
    reportHeaderDate: 'Date',
    reportHeaderClassroom: 'Classroom',
    reportHeaderPeriod: 'Period',
    reportHeaderBorrower: 'Borrower',
    reportHeaderLessonPlanName: 'Lesson Plan Name',
    reportHeaderEquipment: 'Equipment',
    allStatuses: 'All Statuses',

    // User Management
    userManagementTitle: 'User Management',
    addUser: 'Add User',
    editUser: 'Edit User',
    userName: 'Name',
    userRole: 'Role',
    confirmDeleteUserTitle: 'Confirm Deletion',
    confirmDeleteUserText: 'Are you sure you want to delete this user?',
    userAddedSuccess: 'User added successfully.',
    userUpdatedSuccess: 'User updated successfully.',
    userDeletedSuccess: 'User deleted successfully.',
    searchUserPlaceholder: 'Search by name...',
    noUsersFound: 'No users found matching your search.',
    roleTeacher: 'Teacher',
    roleAdmin: 'Admin',

    // Error Messages
    bookingSaveError: "An unexpected error occurred while saving the booking. Please try again.",
    fetchBookingsError: "Failed to load booking data.",
    updateStatusError: "Failed to update status.",
    fetchUsersError: "Failed to load user data.",
    saveUserError: "Failed to save user.",
    deleteUserError: "Failed to delete user.",
  },
  th: {
    // General
    appName: 'ระบบยืม-คืนอุปกรณ์',
    toggleLanguage: 'English',
    loading: 'กำลังโหลด...',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    add: 'เพิ่ม',
    confirm: 'ยืนยัน',
    error: 'ข้อผิดพลาด',
    success: 'สำเร็จ',
    actions: 'การกระทำ',
    search: 'ค้นหา',
    exportLabel: 'ส่งออก',
    copyright: '© 2025 โรงเรียนสาธิตอุดมศึกษา สงวนลิขสิทธิ์',

    // Login
    login: 'เข้าสู่ระบบ',
    username: 'ชื่อผู้ใช้',
    password: 'รหัสผ่าน',
    loginFailed: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน',
    loginSuccess: 'เข้าสู่ระบบสำเร็จ!',

    // Sidebar
    dashboard: 'สถานะอุปกรณ์',
    booking: 'จอง-ยืมอุปกรณ์',
    returnEquipment: 'คืนอุปกรณ์',
    reports: 'รายงาน',
    userManagement: 'จัดการผู้ใช้',
    logout: 'ออกจากระบบ',
    adminBorrow: 'ยืมอุปกรณ์',
    bookingGrid: 'ตารางการจอง',
    
    // Dashboard/Status
    status: 'สถานะ',
    classroom: 'ห้องเรียน',
    period: 'คาบ',
    date: 'วันที่',
    available: 'ว่าง',
    booked: 'มีการจอง',
    inUse: 'กำลังใช้งาน',
    awaitingReturn: 'รอคืน',
    returned: 'คืนแล้ว',
    cancelled: 'ยกเลิกแล้ว',
    equipmentStatus: 'สถานะอุปกรณ์',
    allPrograms: 'ทุกโปรแกรม',
    searchClassroomPlaceholder: 'กรองตามชื่อห้องเรียน...',
    noClassroomsFound: 'ไม่พบห้องเรียนที่ตรงกับตัวกรอง',
    updateStatus: 'อัปเดตสถานะ',
    selectStatus: 'เลือกสถานะ',
    noBookingsToday: 'ไม่มีการจองหรือยืมสำหรับตัวกรองที่เลือกในวันนี้',

    // Booking Form
    bookingForm: 'ฟอร์มจอง-ยืมอุปกรณ์',
    bookingType: 'ประเภท',
    book: 'จอง',
    borrow: 'ยืม',
    teacherName: 'ชื่อ-สกุลครู',
    program: 'โปรแกรม',
    selectProgram: 'เลือกโปรแกรม',
    selectClassroom: 'เลือกห้องเรียน',
    selectTeacher: 'เลือกครู',
    selectPeriod: 'เลือกคาบเรียน',
    usageDate: 'วันที่ใช้งาน',
    learningUnitNumber: 'หน่วยการเรียนรู้ที่',
    learningUnitName: 'ชื่อหน่วยการเรียนรู้',
    lessonPlanName: 'ชื่อแผนการจัดการเรียนรู้',
    equipmentList: 'รายการอุปกรณ์',
    other: 'อื่นๆ (ระบุ)',
    submitBooking: 'ยืนยันการจอง',
    bookingConflictTitle: 'การจองซ้ำซ้อน',
    bookingConflictText: 'ห้องเรียนนี้ถูกจองในวันและคาบที่เลือกแล้ว',
    equipmentConflictTitle: 'อุปกรณ์ถูกจองแล้ว',
    equipmentConflictText: 'มีอุปกรณ์บางรายการที่คุณเลือกถูกจองโดยผู้ใช้อื่นในเวลาเดียวกันแล้ว',
    bookingSuccessTitle: 'จองสำเร็จ!',
    bookingSuccessText: 'การจองอุปกรณ์ของคุณได้รับการยืนยันแล้ว',
    formValidationError: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน',
    programThai: 'โปรแกรมภาษาไทย',
    programEnglish: 'โปรแกรมภาษาอังกฤษ',
    programKindergarten: 'ระดับชั้นอนุบาล',
    confirmDeleteBookingTitle: 'ยืนยันการลบ',
    confirmDeleteBookingText: 'คุณแน่ใจหรือไม่ว่าต้องการลบการจองนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
    deleteBookingSuccess: 'ลบการจองสำเร็จ',
    deleteBookingError: 'ไม่สามารถลบการจองได้',
    
    // Booking Schedule
    selectDate: 'เลือกวันที่',
    bookingSlotAvailable: 'ว่าง',
    bookingSlotBooked: 'จองแล้ว',
    confirmCancelTitle: 'ยืนยันการยกเลิกการจอง',
    confirmCancelText: 'ระบบจะทำการยกเลิกการจองนี้อย่างถาวร ท่านต้องการดำเนินการต่อใช่หรือไม่?',
    confirmCancelAction: 'ใช่, ยกเลิกการจอง',
    denyCancelAction: 'ไม่, เก็บการจองไว้',
    cancelSuccessTitle: 'ยกเลิกการจองสำเร็จ',
    cancelSuccessText: 'การจองของท่านได้ถูกยกเลิกเรียบร้อยแล้ว',
    loadingActionText: 'กำลังดำเนินการ กรุณารอสักครู่...',

    // Return Page & Dashboard
    returnEquipmentTitle: 'การคืนอุปกรณ์',
    pendingReturns: 'รายการที่รอการคืน',
    noPendingReturns: 'ไม่มีอุปกรณ์ที่รอการคืนในขณะนี้',
    teacher: 'ครู',
    equipment: 'อุปกรณ์',
    markAsReturned: 'ทำเครื่องหมายว่าคืนแล้ว',
    returnSuccess: 'ทำเครื่องหมายว่าคืนอุปกรณ์แล้ว',
    confirmReturn: 'ยืนยันการคืน',
    searchPendingReturnsPlaceholder: 'ค้นหาจากครู, ห้องเรียน, หรืออุปกรณ์...',

    // Reports Page
    reportsTitle: 'รายงานการใช้งาน',
    exportToExcel: 'ส่งออกเป็น Excel',
    startDate: 'วันที่เริ่มต้น',
    endDate: 'วันที่สิ้นสุด',
    generateReport: 'สร้างรายงาน',
    searchReportPlaceholder: 'ค้นหาจากผู้ยืม, แผนการเรียนรู้, อุปกรณ์, หรือห้องเรียน...',
    reportHeaderSchool: 'โรงเรียนสาธิตอุดมศึกษา',
    reportHeaderDate: 'วันที่',
    reportHeaderClassroom: 'ห้องเรียน',
    reportHeaderPeriod: 'คาบ',
    reportHeaderBorrower: 'ผู้ยืม',
    reportHeaderLessonPlanName: 'ชื่อแผนการจัดการเรียนรู้',
    reportHeaderEquipment: 'อุปกรณ์',
    allStatuses: 'ทุกสถานะ',

    // User Management
    userManagementTitle: 'จัดการผู้ใช้งาน',
    addUser: 'เพิ่มผู้ใช้',
    editUser: 'แก้ไขผู้ใช้',
    userName: 'ชื่อ',
    userRole: 'สิทธิ์',
    confirmDeleteUserTitle: 'ยืนยันการลบ',
    confirmDeleteUserText: 'คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?',
    userAddedSuccess: 'เพิ่มผู้ใช้สำเร็จ',
    userUpdatedSuccess: 'อัปเดตข้อมูลผู้ใช้สำเร็จ',
    userDeletedSuccess: 'ลบผู้ใช้สำเร็จ',
    searchUserPlaceholder: 'ค้นหาตามชื่อ...',
    noUsersFound: 'ไม่พบผู้ใช้ที่ตรงกับการค้นหาของคุณ',
    roleTeacher: 'ครู',
    roleAdmin: 'ผู้ดูแลระบบ',

    // Error Messages
    bookingSaveError: "เกิดข้อผิดพลาดที่ไม่คาดคิดขณะบันทึกการจอง กรุณาลองใหม่อีกครั้ง",
    fetchBookingsError: "ไม่สามารถโหลดข้อมูลการจองได้",
    updateStatusError: "อัปเดตสถานะไม่สำเร็จ",
    fetchUsersError: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
    saveUserError: "บันทึกข้อมูลผู้ใช้ไม่สำเร็จ",
    deleteUserError: "ลบผู้ใช้ไม่สำเร็จ",
  },
};