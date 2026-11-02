/**
 * 🎓 STUDYFLOW - Complete Client-Side Application Logic
 * 
 * Features:
 * - Supabase Authentication (Login, Sign Up, Forgot Password, Logout, Session Persistence)
 * - Supabase PostgreSQL Database Synchronization (profiles, tasks, study_sessions, user_settings)
 * - Row Level Security (RLS) Compatible (uses authenticated user session)
 * - Free-Text Subject Input (never restricted to a fixed list, with smart suggestions)
 * - Interactive Calendar (monthly grid, priority indicators, day selection, add-task-for-date)
 * - Fully Customizable Study Timer (custom study & break durations, Pomodoro sessions, Web Audio chimes)
 * - Study History & Session Logging to Supabase
 * - Productivity Analytics (animated completion % and study goal progress, 7-day trend chart, subject breakdown)
 * - Local Device Music Player (HTML5 File API, URL.createObjectURL, persistent mini-player across tabs)
 * - Built-in Ambient Focus Sounds Generator (Web Audio API)
 * - Immersive Focus Mode (distraction-free task focus)
 * - Dark & Light Mode Theme System
 * - Toast Notification System
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. APPLICATION STATE
  // =========================================================================
  const state = {
    // Current authenticated user (Supabase or Demo Guest)
    user: null,
    isDemoMode: false,

    // User Profile & Settings
    profile: {
      full_name: 'Student',
      avatar_url: '👨‍🎓',
      study_goal: '4 hours / day'
    },
    settings: {
      theme: 'dark',
      study_duration: 45,
      short_break_duration: 10,
      long_break_duration: 20,
      auto_start_break: false,
      auto_start_study: false,
      notification_sound: true,
      reminder_7_days: true,
      reminder_3_days: true,
      reminder_1_day: true,
      reminder_due_today: true,
      reminder_overdue: true,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    },

    // Tasks Collection
    tasks: [],
    activeFilter: 'all',
    activeSort: 'dueDate',
    searchQuery: '',
    editingTaskId: null,
    pendingDeleteTaskId: null,

    // Calendar State
    currentCalendarDate: new Date(),
    selectedCalendarDateStr: formatDateKey(new Date()),

    // Study Timer State
    timerMode: 'study', // 'study' | 'shortBreak' | 'longBreak'
    timerTimeLeft: 45 * 60,
    timerTotalDuration: 45 * 60,
    timerInterval: null,
    timerIsRunning: false,
    timerActiveTaskId: null,
    studySessions: [],

    // Music Player State
    playlist: [], // Array of { id, title, url, file, isAmbient }
    currentTrackIndex: -1,
    isPlayingMusic: false,
    isLooping: false,
    musicVolume: 0.75,
    ambientAudioNode: null,
    activeAmbientType: null,

    // Focus Mode
    isFocusMode: false,

    // Notification & Deadline Reminder State (Sections 42-69)
    notifications: [],
    sentReminders: new Set(),
    activeBannerTaskId: null,
    dismissedBannerTaskIds: new Set(),
    serviceWorkerReg: null,
    deadlineCheckInterval: null
  };

  // Web Audio Context for Chimes & Ambience
  let webAudioCtx = null;

  // =========================================================================
  // 2. DOM ELEMENTS CACHE
  // =========================================================================
  let dom = {};

  function cacheDomElements() {
    dom = {
      // Auth Overlay & Cards
      authOverlay: document.getElementById('authOverlay'),
      authConnectionBar: document.getElementById('authConnectionBar'),
      authConnDot: document.getElementById('authConnDot'),
      authConnText: document.getElementById('authConnText'),
      authOpenConfigBtn: document.getElementById('authOpenConfigBtn'),
      loginCard: document.getElementById('loginCard'),
      signupCard: document.getElementById('signupCard'),
      forgotCard: document.getElementById('forgotCard'),
      loginForm: document.getElementById('loginForm'),
      signupForm: document.getElementById('signupForm'),
      forgotForm: document.getElementById('forgotForm'),
      loginEmail: document.getElementById('loginEmail'),
      loginPassword: document.getElementById('loginPassword'),
      signupFullName: document.getElementById('signupFullName'),
      signupEmail: document.getElementById('signupEmail'),
      signupPassword: document.getElementById('signupPassword'),
      signupConfirmPassword: document.getElementById('signupConfirmPassword'),
      forgotEmail: document.getElementById('forgotEmail'),
      loginSubmitBtn: document.getElementById('loginSubmitBtn'),
      signupSubmitBtn: document.getElementById('signupSubmitBtn'),
      forgotSubmitBtn: document.getElementById('forgotSubmitBtn'),
      loginSpinner: document.getElementById('loginSpinner'),
      signupSpinner: document.getElementById('signupSpinner'),
      forgotSpinner: document.getElementById('forgotSpinner'),
      toSignUpBtn: document.getElementById('toSignUpBtn'),
      toLoginFromSignupBtn: document.getElementById('toLoginFromSignupBtn'),
      toForgotPasswordBtn: document.getElementById('toForgotPasswordBtn'),
      toLoginFromForgotBtn: document.getElementById('toLoginFromForgotBtn'),
      demoModeBtn: document.getElementById('demoModeBtn'),
      demoModeBadge: document.getElementById('demoModeBadge'),

      // App Header & Navigation
      appLayout: document.getElementById('appLayout'),
      appHeader: document.getElementById('appHeader'),
      navMenu: document.getElementById('navMenu'),
      navLinks: document.querySelectorAll('.nav-link'),
      themeToggleBtn: document.getElementById('themeToggleBtn'),
      themeIcon: document.getElementById('themeIcon'),
      mobileMenuBtn: document.getElementById('mobileMenuBtn'),
      headerFocusModeBtn: document.getElementById('headerFocusModeBtn'),
      profileDropdownBtn: document.getElementById('profileDropdownBtn'),
      profileMenu: document.getElementById('profileMenu'),
      navAvatar: document.getElementById('navAvatar'),
      navUserName: document.getElementById('navUserName'),
      menuUserFullName: document.getElementById('menuUserFullName'),
      menuUserEmail: document.getElementById('menuUserEmail'),
      menuEditProfileBtn: document.getElementById('menuEditProfileBtn'),
      menuTimerSettingsBtn: document.getElementById('menuTimerSettingsBtn'),
      menuSupabaseConfigBtn: document.getElementById('menuSupabaseConfigBtn'),
      menuLogoutBtn: document.getElementById('menuLogoutBtn'),

      // Dashboard Hero & Stats
      heroGreeting: document.getElementById('heroGreeting'),
      heroSubtitle: document.getElementById('heroSubtitle'),
      currentDateText: document.getElementById('currentDateText'),
      heroAddTaskBtn: document.getElementById('heroAddTaskBtn'),
      heroStartFocusBtn: document.getElementById('heroStartFocusBtn'),
      orbStudyGoalText: document.getElementById('orbStudyGoalText'),
      statTotal: document.getElementById('statTotal'),
      statCompleted: document.getElementById('statCompleted'),
      statPending: document.getElementById('statPending'),
      statOverdue: document.getElementById('statOverdue'),
      statProgressFill: document.getElementById('statProgressFill'),
      statPercentage: document.getElementById('statPercentage'),
      progressTasksRatioText: document.getElementById('progressTasksRatioText'),
      progressStatusCaption: document.getElementById('progressStatusCaption'),
      overviewCircleFill: document.getElementById('overviewCircleFill'),
      overviewCircleVal: document.getElementById('overviewCircleVal'),
      asciiTaskProgress: document.getElementById('asciiTaskProgress'),

      // Tasks Section
      openAddModalBtn: document.getElementById('openAddModalBtn'),
      openAddModalBtnSecondary: document.getElementById('openAddModalBtnSecondary'),
      taskSearchInput: document.getElementById('taskSearchInput'),
      clearSearchBtn: document.getElementById('clearSearchBtn'),
      filterBtns: document.querySelectorAll('.filter-btn'),
      taskSortSelect: document.getElementById('taskSortSelect'),
      tasksContainer: document.getElementById('tasksContainer'),
      emptyState: document.getElementById('emptyState'),
      emptyAddBtn: document.getElementById('emptyAddBtn'),
      tasksCountBadge: document.getElementById('tasksCountBadge'),
      countAll: document.getElementById('countAll'),
      countPending: document.getElementById('countPending'),
      countCompleted: document.getElementById('countCompleted'),
      countOverdue: document.getElementById('countOverdue'),
      countHigh: document.getElementById('countHigh'),
      countMedium: document.getElementById('countMedium'),
      countLow: document.getElementById('countLow'),

      // Calendar Section
      calPrevMonthBtn: document.getElementById('calPrevMonthBtn'),
      calNextMonthBtn: document.getElementById('calNextMonthBtn'),
      calMonthYearTitle: document.getElementById('calMonthYearTitle'),
      calendarDaysGrid: document.getElementById('calendarDaysGrid'),
      calendarTodayBtn: document.getElementById('calendarTodayBtn'),
      panelSelectedDateTitle: document.getElementById('panelSelectedDateTitle'),
      panelTasksList: document.getElementById('panelTasksList'),
      calAddTaskForDateBtn: document.getElementById('calAddTaskForDateBtn'),

      // Study Timer Section
      modeStudy: document.getElementById('modeStudy'),
      modeShortBreak: document.getElementById('modeShortBreak'),
      modeLongBreak: document.getElementById('modeLongBreak'),
      modeStudyMinDisplay: document.getElementById('modeStudyMinDisplay'),
      modeShortBreakMinDisplay: document.getElementById('modeShortBreakMinDisplay'),
      modeLongBreakMinDisplay: document.getElementById('modeLongBreakMinDisplay'),
      timerClock: document.getElementById('timerClock'),
      timerStatusText: document.getElementById('timerStatusText'),
      timerCurrentTaskText: document.getElementById('timerCurrentTaskText'),
      timerRingFill: document.getElementById('timerRingFill'),
      timerStartBtn: document.getElementById('timerStartBtn'),
      timerPauseBtn: document.getElementById('timerPauseBtn'),
      timerResetBtn: document.getElementById('timerResetBtn'),
      timerCelebration: document.getElementById('timerCelebration'),
      celebrationTitle: document.getElementById('celebrationTitle'),
      celebrationSubtitle: document.getElementById('celebrationSubtitle'),
      celebrationActionBtn: document.getElementById('celebrationActionBtn'),
      celebrationDismissBtn: document.getElementById('celebrationDismissBtn'),
      studySessionsCountDisplay: document.getElementById('studySessionsCountDisplay'),
      toggleTimerSettingsHeader: document.getElementById('toggleTimerSettingsHeader'),
      timerSettingsBody: document.getElementById('timerSettingsBody'),
      timerSettingsToggleIcon: document.getElementById('timerSettingsToggleIcon'),
      customStudyInput: document.getElementById('customStudyInput'),
      customShortBreakInput: document.getElementById('customShortBreakInput'),
      customLongBreakInput: document.getElementById('customLongBreakInput'),
      autoStartBreakCheck: document.getElementById('autoStartBreakCheck'),
      autoStartStudyCheck: document.getElementById('autoStartStudyCheck'),
      saveTimerSettingsBtn: document.getElementById('saveTimerSettingsBtn'),
      timerSaveFeedback: document.getElementById('timerSaveFeedback'),
      historyTodayTime: document.getElementById('historyTodayTime'),
      historyWeekTime: document.getElementById('historyWeekTime'),
      historyTotalSessions: document.getElementById('historyTotalSessions'),
      sessionsList: document.getElementById('sessionsList'),

      // Productivity Section
      prodTotalTasks: document.getElementById('prodTotalTasks'),
      prodCompletedTasks: document.getElementById('prodCompletedTasks'),
      prodPendingTasks: document.getElementById('prodPendingTasks'),
      prodOverdueTasks: document.getElementById('prodOverdueTasks'),
      prodCompletionPercent: document.getElementById('prodCompletionPercent'),
      prodStudySessions: document.getElementById('prodStudySessions'),
      prodTotalStudyTime: document.getElementById('prodTotalStudyTime'),
      prodTaskBarLabel: document.getElementById('prodTaskBarLabel'),
      prodTaskProgressBar: document.getElementById('prodTaskProgressBar'),
      prodAsciiTask: document.getElementById('prodAsciiTask'),
      prodStudyBarLabel: document.getElementById('prodStudyBarLabel'),
      prodStudyProgressBar: document.getElementById('prodStudyProgressBar'),
      prodAsciiStudy: document.getElementById('prodAsciiStudy'),
      weeklyChartContainer: document.getElementById('weeklyChartContainer'),
      weeklySummaryText: document.getElementById('weeklySummaryText'),
      subjectDistributionList: document.getElementById('subjectDistributionList'),

      // Music Section & Mini Player
      addMusicFilesBtn: document.getElementById('addMusicFilesBtn'),
      musicFileInput: document.getElementById('musicFileInput'),
      playlistContainer: document.getElementById('playlistContainer'),
      playlistCountBadge: document.getElementById('playlistCountBadge'),
      clearPlaylistBtn: document.getElementById('clearPlaylistBtn'),
      ambientBtns: document.querySelectorAll('.ambient-btn'),
      globalAudioPlayer: document.getElementById('globalAudioPlayer'),
      playerArtIcon: document.getElementById('playerArtIcon'),
      playerEqualizer: document.getElementById('playerEqualizer'),
      playerTrackTitle: document.getElementById('playerTrackTitle'),
      playerTrackSource: document.getElementById('playerTrackSource'),
      playerPrevBtn: document.getElementById('playerPrevBtn'),
      playerPlayPauseBtn: document.getElementById('playerPlayPauseBtn'),
      playerNextBtn: document.getElementById('playerNextBtn'),
      playerLoopBtn: document.getElementById('playerLoopBtn'),
      playerCurrentTime: document.getElementById('playerCurrentTime'),
      playerDurationTime: document.getElementById('playerDurationTime'),
      playerSeekSlider: document.getElementById('playerSeekSlider'),
      playerMuteBtn: document.getElementById('playerMuteBtn'),
      playerVolumeSlider: document.getElementById('playerVolumeSlider'),
      playerFocusModeBtn: document.getElementById('playerFocusModeBtn'),

      // Focus Mode Overlay
      focusModeOverlay: document.getElementById('focusModeOverlay'),
      focusTaskSelect: document.getElementById('focusTaskSelect'),
      exitFocusModeBtn: document.getElementById('exitFocusModeBtn'),
      focusRingFill: document.getElementById('focusRingFill'),
      focusTimerClock: document.getElementById('focusTimerClock'),
      focusTimerStatus: document.getElementById('focusTimerStatus'),
      focusTimerTaskDisplay: document.getElementById('focusTimerTaskDisplay'),
      focusStartBtn: document.getElementById('focusStartBtn'),
      focusPauseBtn: document.getElementById('focusPauseBtn'),
      focusResetBtn: document.getElementById('focusResetBtn'),
      focusMusicTitle: document.getElementById('focusMusicTitle'),
      focusMusicPrevBtn: document.getElementById('focusMusicPrevBtn'),
      focusMusicPlayBtn: document.getElementById('focusMusicPlayBtn'),
      focusMusicNextBtn: document.getElementById('focusMusicNextBtn'),

      // Task Modal
      taskModalBackdrop: document.getElementById('taskModalBackdrop'),
      taskModalTitle: document.getElementById('taskModalTitle'),
      taskModalCloseBtn: document.getElementById('taskModalCloseBtn'),
      taskModalCancelBtn: document.getElementById('taskModalCancelBtn'),
      taskForm: document.getElementById('taskForm'),
      taskFormId: document.getElementById('taskFormId'),
      taskTitleInput: document.getElementById('taskTitleInput'),
      taskSubjectInput: document.getElementById('taskSubjectInput'),
      subjectSuggestionsList: document.getElementById('subjectSuggestionsList'),
      taskDescriptionInput: document.getElementById('taskDescriptionInput'),
      taskDueDateInput: document.getElementById('taskDueDateInput'),
      taskPrioritySelect: document.getElementById('taskPrioritySelect'),
      taskStatusSelect: document.getElementById('taskStatusSelect'),
      taskTitleError: document.getElementById('taskTitleError'),
      taskSubjectError: document.getElementById('taskSubjectError'),
      taskDueDateError: document.getElementById('taskDueDateError'),

      // Delete Modal
      deleteModalBackdrop: document.getElementById('deleteModalBackdrop'),
      deleteModalCloseBtn: document.getElementById('deleteModalCloseBtn'),
      cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
      confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
      deleteTaskTitlePreview: document.getElementById('deleteTaskTitlePreview'),

      // Profile Modal
      profileModalBackdrop: document.getElementById('profileModalBackdrop'),
      profileModalCloseBtn: document.getElementById('profileModalCloseBtn'),
      profileModalCancelBtn: document.getElementById('profileModalCancelBtn'),
      profileForm: document.getElementById('profileForm'),
      profileFullNameInput: document.getElementById('profileFullNameInput'),
      profileAvatarChoice: document.getElementById('profileAvatarChoice'),
      profileStudyGoalInput: document.getElementById('profileStudyGoalInput'),

      // Supabase Settings Modal
      supabaseSettingsModal: document.getElementById('supabaseSettingsModal'),
      supabaseModalCloseBtn: document.getElementById('supabaseModalCloseBtn'),
      supabaseConfigForm: document.getElementById('supabaseConfigForm'),
      cfgSupabaseUrl: document.getElementById('cfgSupabaseUrl'),
      cfgSupabaseKey: document.getElementById('cfgSupabaseKey'),
      testSupabaseBtn: document.getElementById('testSupabaseBtn'),
      connectionTestResult: document.getElementById('connectionTestResult'),

      // Toast Notifications
      toastContainer: document.getElementById('toastContainer'),

      // In-App Notification Center (Sections 50-52)
      notificationBellBtn: document.getElementById('notificationBellBtn'),
      notificationBadge: document.getElementById('notificationBadge'),
      notificationPanel: document.getElementById('notificationPanel'),
      notifUnreadCountBadge: document.getElementById('notifUnreadCountBadge'),
      markAllNotificationsReadBtn: document.getElementById('markAllNotificationsReadBtn'),
      notificationItemsList: document.getElementById('notificationItemsList'),
      openNotifSettingsFromPanelBtn: document.getElementById('openNotifSettingsFromPanelBtn'),
      menuNotifSettingsBtn: document.getElementById('menuNotifSettingsBtn'),

      // In-App Critical Deadline Reminder Banner (Section 53)
      deadlineReminderBanner: document.getElementById('deadlineReminderBanner'),
      bannerUrgencyIcon: document.getElementById('bannerUrgencyIcon'),
      bannerUrgencyTag: document.getElementById('bannerUrgencyTag'),
      bannerTimeTag: document.getElementById('bannerTimeTag'),
      bannerTaskTitle: document.getElementById('bannerTaskTitle'),
      bannerTaskSubtext: document.getElementById('bannerTaskSubtext'),
      bannerViewTaskBtn: document.getElementById('bannerViewTaskBtn'),
      bannerDismissBtn: document.getElementById('bannerDismissBtn'),

      // Soft Browser Notification Permission Prompt (Section 44)
      permissionPromptCard: document.getElementById('permissionPromptCard'),
      enableNotificationsBtn: document.getElementById('enableNotificationsBtn'),
      dismissPermissionPromptBtn: document.getElementById('dismissPermissionPromptBtn'),

      // Needs Attention & Upcoming Deadlines Widgets (Sections 54-55)
      needsAttentionCard: document.getElementById('needsAttentionCard'),
      needsAttentionList: document.getElementById('needsAttentionList'),
      needsAttentionCountBadge: document.getElementById('needsAttentionCountBadge'),
      upcomingDeadlinesCard: document.getElementById('upcomingDeadlinesCard'),
      upcomingDeadlinesList: document.getElementById('upcomingDeadlinesList'),
      viewAllDeadlinesLink: document.getElementById('viewAllDeadlinesLink'),

      // Notification & Reminder Settings Modal (Sections 58-60, 64)
      notificationSettingsModal: document.getElementById('notificationSettingsModal'),
      notifModalCloseBtn: document.getElementById('notifModalCloseBtn'),
      notifModalCancelBtn: document.getElementById('notifModalCancelBtn'),
      saveNotifSettingsBtn: document.getElementById('saveNotifSettingsBtn'),
      notifPermissionIcon: document.getElementById('notifPermissionIcon'),
      notifPermissionStatusText: document.getElementById('notifPermissionStatusText'),
      requestNotifPermissionModalBtn: document.getElementById('requestNotifPermissionModalBtn'),
      notifBlockedHelpText: document.getElementById('notifBlockedHelpText'),
      settingNotifSound: document.getElementById('settingNotifSound'),
      settingTiming7Days: document.getElementById('settingTiming7Days'),
      settingTiming3Days: document.getElementById('settingTiming3Days'),
      settingTiming1Day: document.getElementById('settingTiming1Day'),
      settingTimingDueToday: document.getElementById('settingTimingDueToday'),
      settingTimingOverdue: document.getElementById('settingTimingOverdue'),
      settingTimezoneSelect: document.getElementById('settingTimezoneSelect')
    };
  }

  // =========================================================================
  // 3. UTILITY FUNCTIONS
  // =========================================================================
  function formatDateKey(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return 'No due date';
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Timezone-aware deadline calculation (Section 64)
  function getDaysDifference(targetDateStr) {
    if (!targetDateStr) return 0;
    try {
      const tz = state?.settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const todayStrInTz = formatter.format(new Date()); // YYYY-MM-DD
      const [tY, tM, tD] = targetDateStr.split('-').map(Number);
      const [nY, nM, nD] = todayStrInTz.split('-').map(Number);
      const targetUtc = Date.UTC(tY, tM - 1, tD);
      const todayUtc = Date.UTC(nY, nM - 1, nD);
      return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
    } catch (e) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const [y, m, d] = targetDateStr.split('-').map(Number);
      const target = new Date(y, m - 1, d);
      target.setHours(0, 0, 0, 0);
      return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  function formatTimeMinutes(totalMinutes) {
    if (!totalMinutes || totalMinutes <= 0) return '0h 0m';
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function generateAsciiBar(percentage) {
    const totalBars = 20;
    const filledBars = Math.round((percentage / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars) + ` ${percentage}%`;
  }

  // =========================================================================
  // 4. TOAST NOTIFICATION SYSTEM
  // =========================================================================
  function showToast(message, type = 'success') {
    if (!dom.toastContainer) return;

    const icons = {
      success: '✓',
      info: 'ℹ',
      warning: '⚠',
      danger: '✕'
    };

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || '✓'}</span>
      <span class="toast-message">${escapeHtml(message)}</span>
    `;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3800);
  }

  // =========================================================================
  // 5. SUPABASE AUTHENTICATION & SESSION PERSISTENCE
  // =========================================================================
  async function initAuthSystem() {
    updateSupabaseStatusDisplay();

    // Check if Supabase client is configured
    if (window.supabaseClient) {
      try {
        // Restore persistent session from Supabase
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error) {
          console.warn('Supabase getSession error:', error);
        }

        if (session && session.user) {
          console.log('✅ Found existing Supabase session for:', session.user.email);
          await handleAuthSuccess(session.user);
        } else {
          // Check if previously in demo mode
          const wasInDemo = localStorage.getItem('studyflow_demo_mode') === 'true';
          if (wasInDemo) {
            startDemoMode();
          } else {
            showAuthOverlay('login');
          }
        }

        // Listen for authentication changes (login, logout, token refresh)
        window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Supabase Auth State Changed:', event);
          if (event === 'SIGNED_IN' && session?.user) {
            await handleAuthSuccess(session.user);
          } else if (event === 'SIGNED_OUT') {
            handleSignOutCleanup();
          }
        });

      } catch (err) {
        console.error('Error during Supabase session restoration:', err);
        showAuthOverlay('login');
      }
    } else {
      // Supabase is not configured yet
      const wasInDemo = localStorage.getItem('studyflow_demo_mode') === 'true';
      if (wasInDemo) {
        startDemoMode();
      } else {
        showAuthOverlay('login');
      }
    }
  }

  async function updateSupabaseStatusDisplay() {
    const config = window.studyflowConfig ? window.studyflowConfig.getSupabaseConfig() : { isConfigured: false };
    if (dom.authConnDot && dom.authConnText) {
      if (config.isConfigured) {
        dom.authConnDot.classList.add('connected');
        dom.authConnText.textContent = 'Supabase Connected';
      } else {
        dom.authConnDot.classList.remove('connected');
        dom.authConnText.textContent = 'Supabase Not Configured (Using Demo / Local Mode)';
      }
    }
  }

  function showAuthOverlay(cardToShow = 'login') {
    if (dom.authOverlay) dom.authOverlay.style.display = 'flex';
    if (dom.loginCard) dom.loginCard.style.display = cardToShow === 'login' ? 'block' : 'none';
    if (dom.signupCard) dom.signupCard.style.display = cardToShow === 'signup' ? 'block' : 'none';
    if (dom.forgotCard) dom.forgotCard.style.display = cardToShow === 'forgot' ? 'block' : 'none';
  }

  function hideAuthOverlay() {
    if (dom.authOverlay) dom.authOverlay.style.display = 'none';
  }

  async function handleAuthSuccess(supabaseUser) {
    state.user = supabaseUser;
    state.isDemoMode = false;
    localStorage.removeItem('studyflow_demo_mode');
    if (dom.demoModeBadge) dom.demoModeBadge.style.display = 'none';

    hideAuthOverlay();

    // Fetch or initialize user profile, settings, tasks, and sessions from Supabase
    await loadUserDataFromSupabase();

    updateHeroGreeting();
    renderAllViews();
    showToast(`Welcome back, ${state.profile.full_name}! 👋`, 'success');
  }

  function handleSignOutCleanup() {
    state.user = null;
    state.isDemoMode = false;
    state.tasks = [];
    state.studySessions = [];
    localStorage.removeItem('studyflow_demo_mode');
    
    // Stop timers & music
    pauseTimer();
    stopAudio();

    if (dom.profileMenu) dom.profileMenu.style.display = 'none';
    showAuthOverlay('login');
    showToast('Logged out successfully.', 'info');
  }

  // --- Login Handler ---
  async function performLogin(event) {
    event.preventDefault();
    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    let hasError = false;
    if (!email || !email.includes('@')) {
      document.getElementById('loginEmailError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('loginEmailError').style.display = 'none';
    }

    if (!password) {
      document.getElementById('loginPasswordError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('loginPasswordError').style.display = 'none';
    }

    if (hasError) return;

    if (!window.supabaseClient) {
      showToast('Supabase client is not connected. Enter your credentials or click "Explore Demo Mode".', 'warning');
      openSupabaseSettingsModal();
      return;
    }

    // Set loading state
    setButtonLoading(dom.loginSubmitBtn, dom.loginSpinner, document.getElementById('loginBtnLabel'), true, 'Logging in...');

    try {
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showToast(error.message || 'Failed to login with provided credentials.', 'danger');
      } else if (data?.user) {
        await handleAuthSuccess(data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('An unexpected network error occurred.', 'danger');
    } finally {
      setButtonLoading(dom.loginSubmitBtn, dom.loginSpinner, document.getElementById('loginBtnLabel'), false, 'Login');
    }
  }

  // --- Sign Up Handler ---
  async function performSignUp(event) {
    event.preventDefault();
    const fullName = dom.signupFullName.value.trim();
    const email = dom.signupEmail.value.trim();
    const password = dom.signupPassword.value;
    const confirmPassword = dom.signupConfirmPassword.value;

    let hasError = false;
    if (!fullName) {
      document.getElementById('signupNameError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('signupNameError').style.display = 'none';
    }

    if (!email || !email.includes('@')) {
      document.getElementById('signupEmailError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('signupEmailError').style.display = 'none';
    }

    if (!password || password.length < 6) {
      document.getElementById('signupPasswordError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('signupPasswordError').style.display = 'none';
    }

    if (password !== confirmPassword) {
      document.getElementById('signupConfirmError').style.display = 'block';
      hasError = true;
    } else {
      document.getElementById('signupConfirmError').style.display = 'none';
    }

    if (hasError) return;

    if (!window.supabaseClient) {
      showToast('Supabase client is not connected. Configure your Supabase project first.', 'warning');
      openSupabaseSettingsModal();
      return;
    }

    setButtonLoading(dom.signupSubmitBtn, dom.signupSpinner, document.getElementById('signupBtnLabel'), true, 'Creating Account...');

    try {
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        showToast(error.message || 'Account creation failed.', 'danger');
      } else {
        // If Supabase has email confirmation enabled
        if (data?.user && !data.session) {
          showToast('🎉 Account created! Please check your email to confirm your account before logging in.', 'success');
          showAuthOverlay('login');
        } else if (data?.user && data.session) {
          showToast('🎉 Account created successfully!', 'success');
          await handleAuthSuccess(data.user);
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      showToast('Failed to connect to Supabase authentication server.', 'danger');
    } finally {
      setButtonLoading(dom.signupSubmitBtn, dom.signupSpinner, document.getElementById('signupBtnLabel'), false, 'Create Account');
    }
  }

  // --- Forgot Password Handler ---
  async function performForgotPassword(event) {
    event.preventDefault();
    const email = dom.forgotEmail.value.trim();

    if (!email || !email.includes('@')) {
      document.getElementById('forgotEmailError').style.display = 'block';
      return;
    }
    document.getElementById('forgotEmailError').style.display = 'none';

    if (!window.supabaseClient) {
      showToast('Supabase client is not connected.', 'warning');
      return;
    }

    setButtonLoading(dom.forgotSubmitBtn, dom.forgotSpinner, document.getElementById('forgotBtnLabel'), true, 'Sending...');

    try {
      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });

      if (error) {
        showToast(error.message, 'danger');
      } else {
        showToast('Password reset link sent! Check your email inbox.', 'success');
        showAuthOverlay('login');
      }
    } catch (err) {
      showToast('Failed to send reset link.', 'danger');
    } finally {
      setButtonLoading(dom.forgotSubmitBtn, dom.forgotSpinner, document.getElementById('forgotBtnLabel'), false, 'Send Reset Link');
    }
  }

  // --- Logout Handler ---
  async function performLogout() {
    if (window.supabaseClient && state.user && !state.isDemoMode) {
      try {
        await window.supabaseClient.auth.signOut();
      } catch (err) {
        console.warn('Sign out error:', err);
      }
    }
    handleSignOutCleanup();
  }

  // --- Demo Mode (Immediate Preview without signing up) ---
  function startDemoMode() {
    state.isDemoMode = true;
    localStorage.setItem('studyflow_demo_mode', 'true');
    state.user = {
      id: 'demo-user-12345',
      email: 'demo.student@studyflow.edu'
    };

    state.profile = {
      full_name: 'Ahmadullah',
      avatar_url: '👨‍🎓',
      study_goal: '4 hours / day'
    };

    // Load sample initial tasks across all 5 deadline levels (Sections 43-45)
    const now = new Date();
    
    // Overdue by 2 days
    const overdueDate = new Date(now);
    overdueDate.setDate(now.getDate() - 2);
    const overdueStr = formatDateKey(overdueDate);

    // Due today
    const todayStr = formatDateKey(now);

    // Due tomorrow (1 day)
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrowStr = formatDateKey(tomorrowDate);

    // Due in 3 days
    const threeDaysDate = new Date(now);
    threeDaysDate.setDate(now.getDate() + 3);
    const threeDaysStr = formatDateKey(threeDaysDate);

    // Due in 7 days
    const sevenDaysDate = new Date(now);
    sevenDaysDate.setDate(now.getDate() + 7);
    const sevenDaysStr = formatDateKey(sevenDaysDate);

    state.tasks = [
      {
        id: 'demo-task-overdue',
        title: 'Big Data Architecture & Spark Pipeline Lab',
        subject: 'Big Data Engineering',
        description: 'Submit PySpark notebook and cluster metrics report.',
        due_date: overdueStr,
        priority: 'high',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        id: 'demo-task-1',
        title: 'DBMS Normalization & BCNF Assignment',
        subject: 'Database Management Systems',
        description: 'Complete decomposition problems from Chapter 8 and upload SQL schema.',
        due_date: todayStr,
        priority: 'high',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: 'demo-task-2',
        title: 'Operating Systems Process Scheduling Quiz',
        subject: 'Operating Systems',
        description: 'Review Round Robin, SJF, and Priority Scheduling algorithms.',
        due_date: tomorrowStr,
        priority: 'medium',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'demo-task-3days',
        title: 'Machine Learning Gradient Descent Assignment',
        subject: 'Machine Learning',
        description: 'Implement stochastic and mini-batch gradient descent algorithms.',
        due_date: threeDaysStr,
        priority: 'medium',
        status: 'pending',
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'demo-task-7days',
        title: 'Cloud Computing Infrastructure Case Study',
        subject: 'Cloud Computing',
        description: 'Analyze multi-region serverless architectures and SLA metrics.',
        due_date: sevenDaysStr,
        priority: 'low',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 'demo-task-done',
        title: 'Data Structures Binary Tree Traversal Lab',
        subject: 'Data Structures & Algorithms',
        description: 'Implement iterative and recursive In-order, Pre-order, and Post-order traversal.',
        due_date: threeDaysStr,
        priority: 'low',
        status: 'completed',
        created_at: new Date(Date.now() - 86400000 * 4).toISOString()
      }
    ];

    state.studySessions = [
      {
        id: 'demo-session-1',
        duration_minutes: 45,
        session_type: 'study',
        completed_at: new Date().toISOString()
      },
      {
        id: 'demo-session-2',
        duration_minutes: 10,
        session_type: 'break',
        completed_at: new Date().toISOString()
      }
    ];

    // Seed sample notification items (Sections 45, 50-52)
    state.notifications = [
      {
        id: 'demo-notif-1',
        user_id: state.user.id,
        task_id: 'demo-task-overdue',
        title: '⛔ Overdue Task',
        message: 'Your Big Data Architecture & Spark Pipeline Lab is overdue.',
        notification_type: 'overdue',
        is_read: false,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: 'demo-notif-2',
        user_id: state.user.id,
        task_id: 'demo-task-1',
        title: '🚨 Task Due Today',
        message: 'DBMS Normalization & BCNF Assignment is due today.',
        notification_type: 'due_today',
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'demo-notif-3',
        user_id: state.user.id,
        task_id: 'demo-task-2',
        title: '📚 Upcoming Task',
        message: 'Operating Systems Process Scheduling Quiz is due tomorrow.',
        notification_type: 'upcoming',
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'demo-notif-4',
        user_id: state.user.id,
        task_id: 'demo-task-1',
        title: '⏱️ Study Reminder',
        message: 'You have an upcoming task. Start a study session?',
        notification_type: 'study_reminder',
        is_read: true,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString()
      }
    ];

    state.sentReminders = new Set([
      'demo-task-overdue_overdue',
      'demo-task-1_due_today',
      'demo-task-2_1_day'
    ]);

    if (dom.demoModeBadge) dom.demoModeBadge.style.display = 'inline-block';
    hideAuthOverlay();

    updateHeroGreeting();
    renderAllViews();
    showToast('Entered Demo Mode. All features are fully interactive!', 'info');
  }

  function setButtonLoading(btn, spinner, label, isLoading, loadingText) {
    if (!btn) return;
    btn.disabled = isLoading;
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
    if (label && loadingText && isLoading) label.textContent = loadingText;
  }

  // =========================================================================
  // 6. SUPABASE DATABASE OPERATIONS (SYNC, CRUD)
  // =========================================================================
  async function loadUserDataFromSupabase() {
    if (!window.supabaseClient || !state.user || state.isDemoMode) return;

    try {
      const userId = state.user.id;

      // 1. Fetch Profile
      const { data: profileData, error: profileErr } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileData) {
        state.profile = {
          full_name: profileData.full_name || state.user.user_metadata?.full_name || 'Student',
          avatar_url: profileData.avatar_url || '👨‍🎓',
          study_goal: profileData.study_goal || '4 hours / day'
        };
      } else if (profileErr && profileErr.code === 'PGRST116') {
        // No row found: create profile row
        const newProfile = {
          user_id: userId,
          full_name: state.user.user_metadata?.full_name || 'Student',
          avatar_url: '👨‍🎓',
          study_goal: '4 hours / day'
        };
        await window.supabaseClient.from('profiles').insert(newProfile);
        state.profile = newProfile;
      }

      // 2. Fetch User Settings
      const { data: settingsData } = await window.supabaseClient
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settingsData) {
        state.settings = {
          theme: settingsData.theme || 'dark',
          study_duration: Number(settingsData.study_duration) || 45,
          short_break_duration: Number(settingsData.short_break_duration) || 10,
          long_break_duration: Number(settingsData.long_break_duration) || 20,
          auto_start_break: Boolean(settingsData.auto_start_break),
          auto_start_study: Boolean(settingsData.auto_start_study),
          notification_sound: settingsData.notification_sound !== false,
          reminder_7_days: settingsData.reminder_7_days !== false,
          reminder_3_days: settingsData.reminder_3_days !== false,
          reminder_1_day: settingsData.reminder_1_day !== false,
          reminder_due_today: true,
          reminder_overdue: true,
          timezone: settingsData.timezone || profileData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        };
        applyTheme(state.settings.theme);
        updateTimerConfigInputs();
      }

      // 3. Fetch Tasks
      const { data: tasksData, error: tasksErr } = await window.supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (tasksData) {
        state.tasks = tasksData;
      } else if (tasksErr) {
        console.error('Error fetching tasks from Supabase:', tasksErr);
      }

      // 4. Fetch Notifications (Sections 50-52)
      try {
        const { data: notifData } = await window.supabaseClient
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (notifData) {
          state.notifications = notifData;
        }
      } catch (notifErr) {
        console.warn('Could not load notifications from Supabase:', notifErr);
      }

      // 5. Fetch Task Reminders (Section 48 - Duplicate Prevention)
      try {
        const { data: remindersData } = await window.supabaseClient
          .from('task_reminders')
          .select('task_id, reminder_type')
          .eq('user_id', userId);

        if (remindersData) {
          state.sentReminders = new Set(remindersData.map(r => `${r.task_id}_${r.reminder_type}`));
        }
      } catch (remErr) {
        console.warn('Could not load task_reminders from Supabase:', remErr);
      }

      // 6. Fetch Study Sessions
      const { data: sessionsData, error: sessionsErr } = await window.supabaseClient
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (sessionsData) {
        state.studySessions = sessionsData;
      }

      // Sync push subscription if active
      syncPushSubscription();

    } catch (err) {
      console.error('Failed to load user data from Supabase:', err);
      showToast('Could not sync with Supabase database. Working in local memory mode.', 'warning');
    }
  }

  // --- Task CRUD with Supabase ---
  async function saveTaskFromForm(event) {
    event.preventDefault();

    const title = dom.taskTitleInput.value.trim();
    const subject = dom.taskSubjectInput.value.trim(); // Free text!
    const description = dom.taskDescriptionInput.value.trim();
    const dueDate = dom.taskDueDateInput.value;
    const priority = dom.taskPrioritySelect.value;
    const status = dom.taskStatusSelect.value;
    const existingId = dom.taskFormId.value;

    let hasError = false;
    if (!title) {
      dom.taskTitleError.style.display = 'block';
      hasError = true;
    } else {
      dom.taskTitleError.style.display = 'none';
    }

    if (!subject) {
      dom.taskSubjectError.style.display = 'block';
      hasError = true;
    } else {
      dom.taskSubjectError.style.display = 'none';
    }

    if (!dueDate) {
      dom.taskDueDateError.style.display = 'block';
      hasError = true;
    } else {
      dom.taskDueDateError.style.display = 'none';
    }

    if (hasError) return;

    const taskPayload = {
      title,
      subject,
      description,
      due_date: dueDate,
      priority,
      status
    };

    if (existingId) {
      // Check if due date was edited (Section 66 - Edited Due Dates)
      const existingTask = state.tasks.find(t => t.id === existingId);
      const dueDateChanged = existingTask && existingTask.due_date !== dueDate;

      // UPDATE EXISTING TASK
      if (!state.isDemoMode && window.supabaseClient && state.user) {
        try {
          const { error } = await window.supabaseClient
            .from('tasks')
            .update(taskPayload)
            .eq('id', existingId)
            .eq('user_id', state.user.id);

          if (error) throw error;

          // If due date was changed, recalculate reminders and clear previous sent levels for this task
          if (dueDateChanged) {
            await window.supabaseClient
              .from('task_reminders')
              .delete()
              .eq('task_id', existingId)
              .eq('user_id', state.user.id);
          }
        } catch (err) {
          console.error('Supabase task update error:', err);
          showToast('Failed to update task in database.', 'danger');
          return;
        }
      }

      if (dueDateChanged) {
        // Clear in-memory sent reminders for this task so it participates anew
        for (const key of Array.from(state.sentReminders)) {
          if (key.startsWith(`${existingId}_`)) {
            state.sentReminders.delete(key);
          }
        }
      }

      // Update in-memory state
      const idx = state.tasks.findIndex(t => t.id === existingId);
      if (idx !== -1) {
        state.tasks[idx] = { ...state.tasks[idx], ...taskPayload, updated_at: new Date().toISOString() };
      }
      showToast('✓ Task updated successfully!');

    } else {
      // INSERT NEW TASK
      let createdTask = {
        id: 'task-' + Date.now(),
        user_id: state.user?.id || 'demo-user',
        ...taskPayload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (!state.isDemoMode && window.supabaseClient && state.user) {
        try {
          const { data, error } = await window.supabaseClient
            .from('tasks')
            .insert({ ...taskPayload, user_id: state.user.id })
            .select()
            .single();

          if (error) throw error;
          if (data) createdTask = data;
        } catch (err) {
          console.error('Supabase task insert error:', err);
          showToast('Failed to save task to Supabase.', 'danger');
          return;
        }
      }

      state.tasks.unshift(createdTask);
      showToast('✓ Task added successfully!');

      // Check soft permission prompt after first task creation (Section 44)
      checkPromptSoftPermission();
    }

    closeTaskModal();
    renderAllViews();
    updateSubjectSuggestions();
    checkDeadlinesAndTriggerReminders();
  }

  async function deleteTask(taskId) {
    if (!taskId) return;

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        const { error } = await window.supabaseClient
          .from('tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', state.user.id);

        if (error) throw error;

        // Invalidate reminders & notifications for deleted task (Section 67)
        await window.supabaseClient.from('task_reminders').delete().eq('task_id', taskId);
        await window.supabaseClient.from('notifications').delete().eq('task_id', taskId);
      } catch (err) {
        console.error('Supabase task delete error:', err);
        showToast('Failed to delete task from database.', 'danger');
        return;
      }
    }

    // Clean up memory
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    state.notifications = state.notifications.filter(n => n.task_id !== taskId);
    for (const key of Array.from(state.sentReminders)) {
      if (key.startsWith(`${taskId}_`)) {
        state.sentReminders.delete(key);
      }
    }
    if (state.activeBannerTaskId === taskId && dom.deadlineReminderBanner) {
      dom.deadlineReminderBanner.style.display = 'none';
      state.activeBannerTaskId = null;
    }

    closeDeleteModal();
    renderAllViews();
    showToast('✓ Task deleted.');
  }

  async function toggleTaskStatus(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        const { error } = await window.supabaseClient
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', taskId)
          .eq('user_id', state.user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Supabase status toggle error:', err);
        showToast('Could not update task status.', 'danger');
        return;
      }
    }

    task.status = newStatus;
    task.updated_at = new Date().toISOString();

    // If completed: dismiss in-app banner if showing this task (Section 65)
    if (newStatus === 'completed' && state.activeBannerTaskId === taskId && dom.deadlineReminderBanner) {
      dom.deadlineReminderBanner.style.display = 'none';
      state.activeBannerTaskId = null;
    }

    renderAllViews();
    checkDeadlinesAndTriggerReminders();

    if (newStatus === 'completed') {
      showToast('🎉 Task completed! Awesome progress.', 'success');
    } else {
      showToast('Task reopened as pending.', 'info');
    }
  }

  // --- Save Study Session to Supabase ---
  async function recordStudySession(durationMinutes, sessionType) {
    const sessionObj = {
      id: 'session-' + Date.now(),
      user_id: state.user?.id || 'demo-user',
      duration_minutes: durationMinutes,
      session_type: sessionType,
      started_at: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      completed_at: new Date().toISOString()
    };

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        const { data, error } = await window.supabaseClient
          .from('study_sessions')
          .insert({
            user_id: state.user.id,
            duration_minutes: durationMinutes,
            session_type: sessionType,
            started_at: sessionObj.started_at,
            completed_at: sessionObj.completed_at
          })
          .select()
          .single();

        if (data) sessionObj.id = data.id;
      } catch (err) {
        console.warn('Failed to record session in Supabase:', err);
      }
    }

    state.studySessions.unshift(sessionObj);
    renderStudyHistory();
    renderProductivityDashboard();
  }

  // --- Save User Profile to Supabase ---
  async function saveUserProfile(event) {
    event.preventDefault();
    const fullName = dom.profileFullNameInput.value.trim() || 'Student';
    const avatar = dom.profileAvatarChoice.value || '👨‍🎓';
    const goal = dom.profileStudyGoalInput.value.trim() || '4 hours / day';

    state.profile = {
      full_name: fullName,
      avatar_url: avatar,
      study_goal: goal
    };

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        await window.supabaseClient
          .from('profiles')
          .upsert({
            user_id: state.user.id,
            full_name: fullName,
            avatar_url: avatar,
            study_goal: goal,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Failed to update profile in Supabase:', err);
      }
    }

    updateHeroGreeting();
    closeProfileModal();
    showToast('✓ Profile updated successfully!');
  }

  // --- Save Timer Preferences to Supabase ---
  async function saveTimerSettings() {
    const studyMin = Math.max(1, parseInt(dom.customStudyInput.value, 10) || 45);
    const shortBreakMin = Math.max(1, parseInt(dom.customShortBreakInput.value, 10) || 10);
    const longBreakMin = Math.max(1, parseInt(dom.customLongBreakInput.value, 10) || 20);
    const autoBreak = dom.autoStartBreakCheck.checked;
    const autoStudy = dom.autoStartStudyCheck.checked;

    state.settings.study_duration = studyMin;
    state.settings.short_break_duration = shortBreakMin;
    state.settings.long_break_duration = longBreakMin;
    state.settings.auto_start_break = autoBreak;
    state.settings.auto_start_study = autoStudy;

    // If currently paused in current mode, update time left
    if (!state.timerIsRunning) {
      setTimerMode(state.timerMode);
    }

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        await window.supabaseClient
          .from('user_settings')
          .upsert({
            user_id: state.user.id,
            study_duration: studyMin,
            short_break_duration: shortBreakMin,
            long_break_duration: longBreakMin,
            auto_start_break: autoBreak,
            auto_start_study: autoStudy,
            updated_at: new Date().toISOString()
          });
      } catch (err) {
        console.error('Failed to update timer settings in Supabase:', err);
      }
    }

    updateTimerDisplayValues();
    if (dom.timerSaveFeedback) {
      dom.timerSaveFeedback.textContent = '✓ Saved to your account!';
      setTimeout(() => { dom.timerSaveFeedback.textContent = ''; }, 3000);
    }
    showToast('✓ Timer preferences saved.');
  }

  // =========================================================================
  // 7. DASHBOARD HERO & GREETING
  // =========================================================================
  function updateHeroGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let timeGreeting = 'Good evening';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 18) timeGreeting = 'Good afternoon';

    const displayName = state.profile.full_name || 'Student';

    if (dom.heroGreeting) {
      dom.heroGreeting.textContent = `${timeGreeting}, ${displayName} 👋`;
    }

    if (dom.navUserName) dom.navUserName.textContent = displayName;
    if (dom.navAvatar) dom.navAvatar.textContent = state.profile.avatar_url || '👨‍🎓';
    if (dom.menuUserFullName) dom.menuUserFullName.textContent = displayName;
    if (dom.menuUserEmail) dom.menuUserEmail.textContent = state.user?.email || 'student@university.edu';
    if (dom.orbStudyGoalText) dom.orbStudyGoalText.innerHTML = `<span>Goal: ${escapeHtml(state.profile.study_goal || '4h/day')}</span>`;

    // Current Date text
    if (dom.currentDateText) {
      dom.currentDateText.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  // =========================================================================
  // 8. TASK MANAGEMENT & UI RENDERING
  // =========================================================================
  function renderAllViews() {
    renderTasksList();
    renderDashboardStats();
    renderNeedsAttention();
    renderUpcomingDeadlines();
    renderCalendar();
    renderProductivityDashboard();
    renderStudyHistory();
    updateFocusTaskSelector();
    renderNotificationCenter();
    updateDeadlineBanner();
  }

  function getFilteredAndSortedTasks() {
    return state.tasks.filter(task => {
      // 1. Filter by category
      if (state.activeFilter === 'pending' && task.status !== 'pending') return false;
      if (state.activeFilter === 'completed' && task.status !== 'completed') return false;
      if (state.activeFilter === 'high-priority' && task.priority !== 'high') return false;
      if (state.activeFilter === 'medium-priority' && task.priority !== 'medium') return false;
      if (state.activeFilter === 'low-priority' && task.priority !== 'low') return false;
      if (state.activeFilter === 'overdue') {
        if (task.status === 'completed') return false;
        if (getDaysDifference(task.due_date) >= 0) return false;
      }

      // 2. Search query (Title, Subject, Description)
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const inTitle = task.title.toLowerCase().includes(q);
        const inSubj = (task.subject || '').toLowerCase().includes(q);
        const inDesc = (task.description || '').toLowerCase().includes(q);
        if (!inTitle && !inSubj && !inDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (state.activeSort === 'priority') {
        const pOrder = { high: 3, medium: 2, low: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      if (state.activeSort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (state.activeSort === 'recentlyAdded') {
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
      // Default: dueDate ascending
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }

  function renderTasksList() {
    if (!dom.tasksContainer) return;

    const filtered = getFilteredAndSortedTasks();
    updateFilterCounts();

    if (dom.tasksCountBadge) {
      dom.tasksCountBadge.textContent = `${filtered.length} task${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      dom.tasksContainer.innerHTML = '';
      if (dom.emptyState) dom.emptyState.style.display = 'block';
      return;
    }

    if (dom.emptyState) dom.emptyState.style.display = 'none';

    dom.tasksContainer.innerHTML = filtered.map(task => {
      const isCompleted = task.status === 'completed';
      const daysDiff = getDaysDifference(task.due_date);

      // Deadline tag
      let deadlineTagHtml = '';
      if (isCompleted) {
        deadlineTagHtml = `<span class="deadline-badge deadline-completed">✓ Completed</span>`;
      } else if (daysDiff < 0) {
        deadlineTagHtml = `<span class="deadline-badge deadline-overdue">🚨 Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'}</span>`;
      } else if (daysDiff === 0) {
        deadlineTagHtml = `<span class="deadline-badge deadline-today">⏳ Due Today</span>`;
      } else if (daysDiff === 1) {
        deadlineTagHtml = `<span class="deadline-badge deadline-tomorrow">Due Tomorrow</span>`;
      } else {
        deadlineTagHtml = `<span class="deadline-badge deadline-upcoming">Due in ${daysDiff} days</span>`;
      }

      // Priority tag
      const priorityLabels = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low' };
      const priorityTagHtml = `<span class="priority-badge priority-${task.priority}">${priorityLabels[task.priority] || 'Medium'}</span>`;

      return `
        <div class="task-card ${isCompleted ? 'task-completed' : ''}" data-id="${task.id}">
          <div class="task-card-header">
            <div class="task-badges-row">
              <span class="subject-badge">${escapeHtml(task.subject || 'General')}</span>
              ${priorityTagHtml}
            </div>
            <div class="task-actions-menu">
              <button type="button" class="task-action-btn btn-focus-task" data-id="${task.id}" title="Focus on this task">🎯</button>
              <button type="button" class="task-action-btn btn-edit-task" data-id="${task.id}" title="Edit task">✏️</button>
              <button type="button" class="task-action-btn btn-delete-task" data-id="${task.id}" title="Delete task">🗑️</button>
            </div>
          </div>

          <div class="task-card-body">
            <div class="task-checkbox-wrap">
              <input type="checkbox" class="task-checkbox" id="check-${task.id}" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              <label for="check-${task.id}" class="task-checkbox-custom" aria-label="Toggle completed"></label>
            </div>
            <div class="task-text-content">
              <h3 class="task-title ${isCompleted ? 'strike-through' : ''}">${escapeHtml(task.title)}</h3>
              ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
            </div>
          </div>

          <div class="task-card-footer">
            <div class="task-date-info">
              <span class="date-icon">📅</span>
              <span class="due-date-text">${formatDisplayDate(task.due_date)}</span>
            </div>
            ${deadlineTagHtml}
          </div>
        </div>
      `;
    }).join('');

    // Attach listeners on newly rendered task cards
    dom.tasksContainer.querySelectorAll('.task-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        toggleTaskStatus(e.target.dataset.id);
      });
    });

    dom.tasksContainer.querySelectorAll('.btn-edit-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openEditTaskModal(id);
      });
    });

    dom.tasksContainer.querySelectorAll('.btn-delete-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        openDeleteTaskModal(id);
      });
    });

    dom.tasksContainer.querySelectorAll('.btn-focus-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        selectTaskForFocus(id);
      });
    });
  }

  function updateFilterCounts() {
    const total = state.tasks.length;
    const pending = state.tasks.filter(t => t.status === 'pending').length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const overdue = state.tasks.filter(t => t.status !== 'completed' && getDaysDifference(t.due_date) < 0).length;
    const high = state.tasks.filter(t => t.priority === 'high').length;
    const medium = state.tasks.filter(t => t.priority === 'medium').length;
    const low = state.tasks.filter(t => t.priority === 'low').length;

    if (dom.countAll) dom.countAll.textContent = total;
    if (dom.countPending) dom.countPending.textContent = pending;
    if (dom.countCompleted) dom.countCompleted.textContent = completed;
    if (dom.countOverdue) dom.countOverdue.textContent = overdue;
    if (dom.countHigh) dom.countHigh.textContent = high;
    if (dom.countMedium) dom.countMedium.textContent = medium;
    if (dom.countLow) dom.countLow.textContent = low;
  }

  function updateSubjectSuggestions() {
    if (!dom.subjectSuggestionsList) return;
    const existingSubjects = Array.from(new Set(state.tasks.map(t => t.subject).filter(Boolean)));
    const defaultSuggestions = [
      'Database Management Systems',
      'Operating Systems',
      'Data Structures & Algorithms',
      'Computer Networks',
      'Mathematics',
      'Artificial Intelligence',
      'Software Engineering',
      'Web Development'
    ];
    const combined = Array.from(new Set([...defaultSuggestions, ...existingSubjects]));

    dom.subjectSuggestionsList.innerHTML = combined
      .map(s => `<option value="${escapeHtml(s)}">`)
      .join('');
  }

  // =========================================================================
  // 9. DASHBOARD METRICS & PROGRESS BARS
  // =========================================================================
  function renderDashboardStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const pending = state.tasks.filter(t => t.status === 'pending').length;
    const overdue = state.tasks.filter(t => t.status !== 'completed' && getDaysDifference(t.due_date) < 0).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (dom.statTotal) dom.statTotal.textContent = total;
    if (dom.statCompleted) dom.statCompleted.textContent = completed;
    if (dom.statPending) dom.statPending.textContent = pending;
    if (dom.statOverdue) dom.statOverdue.textContent = overdue;

    if (dom.statPercentage) dom.statPercentage.textContent = `${percentage}%`;
    if (dom.statProgressFill) dom.statProgressFill.style.width = `${percentage}%`;
    if (dom.progressTasksRatioText) {
      dom.progressTasksRatioText.textContent = `${completed} of ${total} tasks completed`;
    }

    if (dom.progressStatusCaption) {
      if (percentage === 100 && total > 0) {
        dom.progressStatusCaption.textContent = '🎉 All tasks completed! Outstanding job.';
      } else if (percentage >= 70) {
        dom.progressStatusCaption.textContent = '🔥 Incredible momentum! Almost there.';
      } else if (percentage >= 30) {
        dom.progressStatusCaption.textContent = '👍 Steady progress! Keep pushing.';
      } else {
        dom.progressStatusCaption.textContent = 'Let\'s start checking off tasks today!';
      }
    }

    // Circular meter: circumference = 2 * PI * 50 = 314.159
    const circleCircumference = 314.16;
    const offset = circleCircumference - (percentage / 100) * circleCircumference;
    if (dom.overviewCircleFill) {
      dom.overviewCircleFill.style.strokeDashoffset = offset;
    }
    if (dom.overviewCircleVal) {
      dom.overviewCircleVal.textContent = `${percentage}%`;
    }

    // ASCII Progress as required in prompt
    if (dom.asciiTaskProgress) {
      dom.asciiTaskProgress.textContent = `Task Completion: ${generateAsciiBar(percentage)}`;
    }
  }

  // =========================================================================
  // 10. INTERACTIVE CALENDAR
  // =========================================================================
  function renderCalendar() {
    if (!dom.calendarDaysGrid || !dom.calMonthYearTitle) return;

    const year = state.currentCalendarDate.getFullYear();
    const month = state.currentCalendarDate.getMonth();

    // Month & Year title
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    dom.calMonthYearTitle.textContent = `${monthNames[month]} ${year}`;

    // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
    // Convert to Monday = 0, Sunday = 6
    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    let gridHtml = '';

    // 1. Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDate = prevMonthDays - i;
      gridHtml += `<div class="calendar-day-cell cal-day-other"><span class="day-num">${prevDate}</span></div>`;
    }

    // 2. Current month days
    const todayStr = formatDateKey(new Date());

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateKey = formatDateKey(dateObj);
      const isToday = dateKey === todayStr;
      const isSelected = dateKey === state.selectedCalendarDateStr;

      // Find tasks for this day
      const dayTasks = state.tasks.filter(t => t.due_date === dateKey);
      const pendingDayTasks = dayTasks.filter(t => t.status !== 'completed');

      let dotsHtml = '';
      if (dayTasks.length > 0) {
        // Calculate deadline urgency for uncompleted tasks (Section 57)
        let urgencyDotHtml = '';
        if (pendingDayTasks.length > 0) {
          const daysDiff = getDaysDifference(dateKey);
          let urgencyClass = 'dot-normal';
          let urgencyTitle = 'Scheduled tasks';
          if (daysDiff < 0 || daysDiff === 0) {
            urgencyClass = 'dot-critical';
            urgencyTitle = daysDiff === 0 ? '🔴 Critical: Due today' : '🔴 Critical: Overdue';
          } else if (daysDiff <= 3) {
            urgencyClass = 'dot-urgent';
            urgencyTitle = daysDiff === 1 ? '🟠 Urgent: Due tomorrow' : '🟠 Upcoming: Due in 3 days';
          } else if (daysDiff <= 7) {
            urgencyClass = 'dot-approaching';
            urgencyTitle = '🟡 Approaching deadline';
          }
          urgencyDotHtml = `<span class="cal-urgency-dot ${urgencyClass}" title="${urgencyTitle}"></span>`;
        }

        dotsHtml = `
          <div class="cal-task-indicators">
            ${urgencyDotHtml}
            ${dayTasks.slice(0, 2).map(t => `<span class="cal-task-dot dot-${t.priority}"></span>`).join('')}
            ${dayTasks.length > 2 ? `<span class="cal-more-tag">+${dayTasks.length - 2}</span>` : ''}
          </div>
        `;
      }

      gridHtml += `
        <div class="calendar-day-cell ${isToday ? 'cal-today' : ''} ${isSelected ? 'cal-selected' : ''}" data-date="${dateKey}">
          <span class="day-num">${day}</span>
          ${dotsHtml}
        </div>
      `;
    }

    // 3. Next month filler days (fill up to complete weeks)
    const totalRendered = firstDayIndex + totalDaysInMonth;
    const remainingDays = (7 - (totalRendered % 7)) % 7;
    for (let j = 1; j <= remainingDays; j++) {
      gridHtml += `<div class="calendar-day-cell cal-day-other"><span class="day-num">${j}</span></div>`;
    }

    dom.calendarDaysGrid.innerHTML = gridHtml;

    // Attach click events on day cells
    dom.calendarDaysGrid.querySelectorAll('.calendar-day-cell:not(.cal-day-other)').forEach(cell => {
      cell.addEventListener('click', () => {
        selectCalendarDate(cell.dataset.date);
      });
    });

    renderSelectedDatePanel();
  }

  function selectCalendarDate(dateKey) {
    if (!dateKey) return;
    state.selectedCalendarDateStr = dateKey;
    renderCalendar();
  }

  function renderSelectedDatePanel() {
    if (!dom.panelSelectedDateTitle || !dom.panelTasksList) return;

    const dateKey = state.selectedCalendarDateStr;
    const [y, m, d] = dateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);

    dom.panelSelectedDateTitle.textContent = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const dayTasks = state.tasks.filter(t => t.due_date === dateKey);

    if (dayTasks.length === 0) {
      dom.panelTasksList.innerHTML = `
        <div class="panel-empty-hint">
          <span class="hint-icon">☀️</span>
          <p>No tasks scheduled for this day.</p>
        </div>
      `;
      return;
    }

    dom.panelTasksList.innerHTML = dayTasks.map(task => {
      const isCompleted = task.status === 'completed';
      return `
        <div class="panel-task-item ${isCompleted ? 'panel-task-done' : ''}">
          <input type="checkbox" class="panel-task-chk" data-id="${task.id}" ${isCompleted ? 'checked' : ''}>
          <div class="panel-task-content">
            <span class="panel-task-subj">${escapeHtml(task.subject || 'General')}</span>
            <p class="panel-task-title">${escapeHtml(task.title)}</p>
          </div>
          <span class="priority-dot-sm dot-${task.priority}"></span>
        </div>
      `;
    }).join('');

    dom.panelTasksList.querySelectorAll('.panel-task-chk').forEach(chk => {
      chk.addEventListener('change', (e) => {
        toggleTaskStatus(e.target.dataset.id);
      });
    });
  }

  // =========================================================================
  // 11. CUSTOM STUDY TIMER & POMODORO SESSIONS
  // =========================================================================
  function updateTimerConfigInputs() {
    if (dom.customStudyInput) dom.customStudyInput.value = state.settings.study_duration;
    if (dom.customShortBreakInput) dom.customShortBreakInput.value = state.settings.short_break_duration;
    if (dom.customLongBreakInput) dom.customLongBreakInput.value = state.settings.long_break_duration;
    if (dom.autoStartBreakCheck) dom.autoStartBreakCheck.checked = state.settings.auto_start_break;
    if (dom.autoStartStudyCheck) dom.autoStartStudyCheck.checked = state.settings.auto_start_study;
    updateTimerDisplayValues();
  }

  function updateTimerDisplayValues() {
    if (dom.modeStudyMinDisplay) dom.modeStudyMinDisplay.textContent = state.settings.study_duration;
    if (dom.modeShortBreakMinDisplay) dom.modeShortBreakMinDisplay.textContent = state.settings.short_break_duration;
    if (dom.modeLongBreakMinDisplay) dom.modeLongBreakMinDisplay.textContent = state.settings.long_break_duration;
  }

  function setTimerMode(mode) {
    state.timerMode = mode;
    pauseTimer();

    // Determine duration based on user custom settings
    let durationMins = state.settings.study_duration;
    let modeText = 'Ready to Study';

    if (mode === 'shortBreak') {
      durationMins = state.settings.short_break_duration;
      modeText = 'Short Break';
    } else if (mode === 'longBreak') {
      durationMins = state.settings.long_break_duration;
      modeText = 'Long Break';
    }

    state.timerTotalDuration = durationMins * 60;
    state.timerTimeLeft = state.timerTotalDuration;

    // Update active tab buttons
    if (dom.modeStudy) dom.modeStudy.classList.toggle('active', mode === 'study');
    if (dom.modeShortBreak) dom.modeShortBreak.classList.toggle('active', mode === 'shortBreak');
    if (dom.modeLongBreak) dom.modeLongBreak.classList.toggle('active', mode === 'longBreak');

    if (dom.timerStatusText) dom.timerStatusText.textContent = modeText;
    if (dom.timerCelebration) dom.timerCelebration.style.display = 'none';

    renderTimerDisplay();
  }

  function startTimer() {
    if (state.timerIsRunning) return;
    initWebAudioContext();

    state.timerIsRunning = true;
    if (dom.timerStartBtn) dom.timerStartBtn.disabled = true;
    if (dom.timerPauseBtn) dom.timerPauseBtn.disabled = false;
    if (dom.focusStartBtn) dom.focusStartBtn.disabled = true;
    if (dom.focusPauseBtn) dom.focusPauseBtn.disabled = false;

    if (dom.timerStatusText) {
      dom.timerStatusText.textContent = state.timerMode === 'study' ? 'Deep Focus Session' : 'Relax & Recharge';
    }

    state.timerInterval = setInterval(() => {
      state.timerTimeLeft--;
      renderTimerDisplay();

      if (state.timerTimeLeft <= 0) {
        completeTimerSession();
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timerIsRunning = false;
    clearInterval(state.timerInterval);

    if (dom.timerStartBtn) dom.timerStartBtn.disabled = false;
    if (dom.timerPauseBtn) dom.timerPauseBtn.disabled = true;
    if (dom.focusStartBtn) dom.focusStartBtn.disabled = false;
    if (dom.focusPauseBtn) dom.focusPauseBtn.disabled = true;

    if (dom.timerStatusText && state.timerTimeLeft < state.timerTotalDuration) {
      dom.timerStatusText.textContent = 'Session Paused';
    }
  }

  function resetTimer() {
    pauseTimer();
    state.timerTimeLeft = state.timerTotalDuration;
    if (dom.timerCelebration) dom.timerCelebration.style.display = 'none';
    if (dom.timerStatusText) {
      dom.timerStatusText.textContent = state.timerMode === 'study' ? 'Ready to Study' : 'Break Time';
    }
    renderTimerDisplay();
  }

  function renderTimerDisplay() {
    const mins = Math.floor(state.timerTimeLeft / 60);
    const secs = state.timerTimeLeft % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (dom.timerClock) dom.timerClock.textContent = timeStr;
    if (dom.focusTimerClock) dom.focusTimerClock.textContent = timeStr;

    // Circular SVG Progress Ring
    // Radius = 125, circumference = 2 * PI * 125 = 785.4
    const circumference = 785.4;
    const offset = circumference - (state.timerTimeLeft / state.timerTotalDuration) * circumference;

    if (dom.timerRingFill) {
      dom.timerRingFill.style.strokeDashoffset = offset;
      if (state.timerMode === 'study') {
        dom.timerRingFill.style.stroke = 'url(#timerGlowGrad)';
      } else {
        dom.timerRingFill.style.stroke = 'url(#timerBreakGrad)';
      }
    }

    // Focus mode ring: radius = 145, circumference = 911
    if (dom.focusRingFill) {
      const focusCircumference = 911;
      const focusOffset = focusCircumference - (state.timerTimeLeft / state.timerTotalDuration) * focusCircumference;
      dom.focusRingFill.style.strokeDashoffset = focusOffset;
    }
  }

  function completeTimerSession() {
    pauseTimer();
    playChimeSound();

    const completedDurationMins = Math.round(state.timerTotalDuration / 60);

    if (state.timerMode === 'study') {
      // Record study session
      recordStudySession(completedDurationMins, 'study');

      // Celebration banner
      if (dom.celebrationTitle) dom.celebrationTitle.textContent = '🎉 Study session completed!';
      if (dom.celebrationSubtitle) dom.celebrationSubtitle.textContent = 'Great discipline! Take a well-earned break.';
      if (dom.celebrationActionBtn) {
        dom.celebrationActionBtn.textContent = '☕ Start Break';
        dom.celebrationActionBtn.onclick = () => {
          setTimerMode('shortBreak');
          startTimer();
        };
      }
      if (dom.timerCelebration) dom.timerCelebration.style.display = 'block';

      showToast(`🎉 Completed ${completedDurationMins}m study session!`, 'success');

      // Auto start break if enabled
      if (state.settings.auto_start_break) {
        setTimeout(() => {
          setTimerMode('shortBreak');
          startTimer();
        }, 1500);
      }

    } else {
      // Record break session
      recordStudySession(completedDurationMins, 'break');

      if (dom.celebrationTitle) dom.celebrationTitle.textContent = '📚 Break finished!';
      if (dom.celebrationSubtitle) dom.celebrationSubtitle.textContent = 'Refreshed and recharged? Let\'s get back to work.';
      if (dom.celebrationActionBtn) {
        dom.celebrationActionBtn.textContent = '🎯 Start Study';
        dom.celebrationActionBtn.onclick = () => {
          setTimerMode('study');
          startTimer();
        };
      }
      if (dom.timerCelebration) dom.timerCelebration.style.display = 'block';

      showToast('Break finished! Ready to focus?', 'info');

      // Auto start study if enabled
      if (state.settings.auto_start_study) {
        setTimeout(() => {
          setTimerMode('study');
          startTimer();
        }, 1500);
      }
    }
  }

  // --- Web Audio Chime Synthesizer ---
  function initWebAudioContext() {
    if (!webAudioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) webAudioCtx = new AudioContextClass();
    }
    if (webAudioCtx && webAudioCtx.state === 'suspended') {
      webAudioCtx.resume();
    }
  }

  function playChimeSound() {
    try {
      initWebAudioContext();
      if (!webAudioCtx) return;

      const now = webAudioCtx.currentTime;

      // Two-tone bell chime (587.33Hz D5 -> 880Hz A5)
      const osc1 = webAudioCtx.createOscillator();
      const gain1 = webAudioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(webAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      const osc2 = webAudioCtx.createOscillator();
      const gain2 = webAudioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.25);
      gain2.gain.setValueAtTime(0.35, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc2.connect(gain2);
      gain2.connect(webAudioCtx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.8);

    } catch (err) {
      console.warn('Audio chime error:', err);
    }
  }

  function renderStudyHistory() {
    // 1. Calculate today's study minutes
    const todayStr = formatDateKey(new Date());
    const todaySessions = state.studySessions.filter(s => {
      return s.session_type === 'study' && s.completed_at && s.completed_at.startsWith(todayStr);
    });
    const todayMins = todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    // 2. Calculate this week's study minutes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weekSessions = state.studySessions.filter(s => {
      return s.session_type === 'study' && new Date(s.completed_at) >= sevenDaysAgo;
    });
    const weekMins = weekSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    // 3. Total study sessions count
    const totalStudyCount = state.studySessions.filter(s => s.session_type === 'study').length;

    if (dom.historyTodayTime) dom.historyTodayTime.textContent = formatTimeMinutes(todayMins);
    if (dom.historyWeekTime) dom.historyWeekTime.textContent = formatTimeMinutes(weekMins);
    if (dom.historyTotalSessions) dom.historyTotalSessions.textContent = totalStudyCount;
    if (dom.studySessionsCountDisplay) dom.studySessionsCountDisplay.textContent = todaySessions.length;

    // Render list of recent completed sessions
    if (dom.sessionsList) {
      if (state.studySessions.length === 0) {
        dom.sessionsList.innerHTML = `<p class="sessions-empty-text">No recorded study sessions yet. Start your first session above!</p>`;
        return;
      }

      dom.sessionsList.innerHTML = state.studySessions.slice(0, 5).map(s => {
        const isStudy = s.session_type === 'study';
        const dateObj = new Date(s.completed_at);
        const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return `
          <div class="session-item-row">
            <span class="session-type-badge ${isStudy ? 'session-type-study' : 'session-type-break'}">
              ${isStudy ? '🎯 Study Session' : '☕ Break Session'}
            </span>
            <span class="session-duration-tag"><strong>${s.duration_minutes}m</strong></span>
            <span class="session-time-text">${dateStr}, ${timeStr}</span>
          </div>
        `;
      }).join('');
    }
  }

  // =========================================================================
  // 12. PRODUCTIVITY ANALYTICS & WEEKLY CHART
  // =========================================================================
  function renderProductivityDashboard() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const pending = state.tasks.filter(t => t.status === 'pending').length;
    const overdue = state.tasks.filter(t => t.status !== 'completed' && getDaysDifference(t.due_date) < 0).length;
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const totalStudyMins = state.studySessions
      .filter(s => s.session_type === 'study')
      .reduce((acc, s) => acc + (s.duration_minutes || 0), 0);

    const studySessionsCount = state.studySessions.filter(s => s.session_type === 'study').length;

    if (dom.prodTotalTasks) dom.prodTotalTasks.textContent = total;
    if (dom.prodCompletedTasks) dom.prodCompletedTasks.textContent = completed;
    if (dom.prodPendingTasks) dom.prodPendingTasks.textContent = pending;
    if (dom.prodOverdueTasks) dom.prodOverdueTasks.textContent = overdue;
    if (dom.prodCompletionPercent) dom.prodCompletionPercent.textContent = `${completionPercent}%`;
    if (dom.prodStudySessions) dom.prodStudySessions.textContent = studySessionsCount;
    if (dom.prodTotalStudyTime) dom.prodTotalStudyTime.textContent = formatTimeMinutes(totalStudyMins);

    // Task Completion Progress Bar
    if (dom.prodTaskBarLabel) dom.prodTaskBarLabel.textContent = `${completionPercent}%`;
    if (dom.prodTaskProgressBar) dom.prodTaskProgressBar.style.width = `${completionPercent}%`;
    if (dom.prodAsciiTask) dom.prodAsciiTask.textContent = `Task Completion: ${generateAsciiBar(completionPercent)}`;

    // Study Time vs Target Goal
    // Parse user goal e.g. "4 hours / day" -> 240 mins target
    let targetMins = 240;
    const goalMatch = (state.profile.study_goal || '').match(/(\d+)/);
    if (goalMatch) targetMins = parseInt(goalMatch[1], 10) * 60;
    const studyPercent = targetMins > 0 ? Math.min(100, Math.round((totalStudyMins / targetMins) * 100)) : 0;

    if (dom.prodStudyBarLabel) dom.prodStudyBarLabel.textContent = `${studyPercent}% (${formatTimeMinutes(totalStudyMins)} / ${formatTimeMinutes(targetMins)})`;
    if (dom.prodStudyProgressBar) dom.prodStudyProgressBar.style.width = `${studyPercent}%`;
    if (dom.prodAsciiStudy) dom.prodAsciiStudy.textContent = `Study Time:      ${generateAsciiBar(studyPercent)}`;

    // 7-Day Trend Chart
    renderWeeklyTrendChart();

    // Subject breakdown
    renderSubjectBreakdown();
  }

  function renderWeeklyTrendChart() {
    if (!dom.weeklyChartContainer) return;

    const days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = formatDateKey(d);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      // Completed tasks for this day
      const completedOnDay = state.tasks.filter(t => {
        return t.status === 'completed' && t.updated_at && t.updated_at.startsWith(key);
      }).length;

      days.push({ dayLabel, count: completedOnDay });
    }

    const maxCount = Math.max(1, ...days.map(d => d.count));
    const totalWeeklyCompleted = days.reduce((sum, d) => sum + d.count, 0);

    if (dom.weeklySummaryText) {
      dom.weeklySummaryText.textContent = `Total ${totalWeeklyCompleted} task${totalWeeklyCompleted === 1 ? '' : 's'} completed this week`;
    }

    dom.weeklyChartContainer.innerHTML = days.map(d => {
      const heightPercent = Math.max(12, Math.round((d.count / maxCount) * 100));
      return `
        <div class="chart-col">
          <div class="chart-bar-wrap" title="${d.count} tasks completed">
            <span class="chart-val-tooltip">${d.count}</span>
            <div class="chart-bar ${d.count > 0 ? 'active-bar' : ''}" style="height: ${heightPercent}%;"></div>
          </div>
          <span class="chart-day-label">${d.dayLabel}</span>
        </div>
      `;
    }).join('');
  }

  function renderSubjectBreakdown() {
    if (!dom.subjectDistributionList) return;

    const subjectCounts = {};
    state.tasks.forEach(t => {
      const s = (t.subject || 'Uncategorized').trim();
      subjectCounts[s] = (subjectCounts[s] || 0) + 1;
    });

    const entries = Object.entries(subjectCounts);
    if (entries.length === 0) {
      dom.subjectDistributionList.innerHTML = `<p class="sessions-empty-text">No subjects added yet. Add tasks with custom subjects!</p>`;
      return;
    }

    dom.subjectDistributionList.innerHTML = entries.map(([subj, count]) => {
      return `
        <div class="subject-stat-card">
          <div class="subject-stat-header">
            <span class="subject-stat-name">📖 ${escapeHtml(subj)}</span>
            <span class="subject-stat-count">${count} task${count === 1 ? '' : 's'}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // =========================================================================
  // 13. MUSIC PLAYER & LOCAL AUDIO LIBRARY (BROWSER FILE API)
  // =========================================================================
  function handleLocalMusicFiles(files) {
    if (!files || files.length === 0) return;

    let addedCount = 0;
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)) {
        return;
      }

      // Create local object URL using Browser API
      const objectUrl = URL.createObjectURL(file);
      const trackObj = {
        id: 'track-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: objectUrl,
        file: file,
        isAmbient: false
      };

      state.playlist.push(trackObj);
      addedCount++;
    });

    if (addedCount > 0) {
      showToast(`🎵 Added ${addedCount} track${addedCount === 1 ? '' : 's'} to playlist!`);
      renderPlaylist();

      // If nothing is playing, load first track
      if (state.currentTrackIndex === -1 && state.playlist.length > 0) {
        loadTrack(0, false);
      }
    } else {
      showToast('Please select valid audio files (MP3, WAV, OGG, M4A).', 'warning');
    }
  }

  function renderPlaylist() {
    if (!dom.playlistContainer) return;

    if (dom.playlistCountBadge) {
      dom.playlistCountBadge.textContent = `${state.playlist.length} track${state.playlist.length === 1 ? '' : 's'}`;
    }

    if (dom.clearPlaylistBtn) {
      dom.clearPlaylistBtn.style.display = state.playlist.length > 0 ? 'inline-block' : 'none';
    }

    if (state.playlist.length === 0) {
      dom.playlistContainer.innerHTML = `
        <div class="playlist-empty-state">
          <span class="empty-music-icon">🎧</span>
          <h4>No music tracks in queue</h4>
          <p>Click "<strong>+ Add Music from Device</strong>" above to load audio files from your computer, phone, or tablet.</p>
        </div>
      `;
      return;
    }

    dom.playlistContainer.innerHTML = state.playlist.map((track, idx) => {
      const isCurrent = idx === state.currentTrackIndex;
      return `
        <div class="playlist-track-row ${isCurrent ? 'playing' : ''}" data-index="${idx}">
          <div class="track-left">
            <button type="button" class="track-index-btn" data-index="${idx}">
              ${isCurrent && state.isPlayingMusic ? '⏸' : '▶'}
            </button>
            <div class="track-info-cell">
              <span class="track-row-title">${escapeHtml(track.title)}</span>
              <span class="track-row-meta">${track.isAmbient ? 'Instant Ambience Generator' : 'Local Device Audio'}</span>
            </div>
          </div>
          <div class="track-right">
            <button type="button" class="track-remove-btn" data-index="${idx}" title="Remove track">✕</button>
          </div>
        </div>
      `;
    }).join('');

    dom.playlistContainer.querySelectorAll('.track-index-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        if (state.currentTrackIndex === idx && state.isPlayingMusic) {
          pauseAudio();
        } else {
          loadTrack(idx, true);
        }
      });
    });

    dom.playlistContainer.querySelectorAll('.track-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        removeTrackFromPlaylist(idx);
      });
    });
  }

  function loadTrack(index, autoPlay = true) {
    if (index < 0 || index >= state.playlist.length) return;

    // Stop ambient if active
    stopAmbientSound();

    state.currentTrackIndex = index;
    const track = state.playlist[index];

    if (dom.globalAudioPlayer) {
      dom.globalAudioPlayer.src = track.url;
      dom.globalAudioPlayer.volume = state.musicVolume;
      dom.globalAudioPlayer.loop = state.isLooping;

      if (autoPlay) {
        playAudio();
      }
    }

    updatePlayerUI(track);
    renderPlaylist();
  }

  function playAudio() {
    if (state.currentTrackIndex === -1 && state.playlist.length > 0) {
      loadTrack(0, true);
      return;
    }

    if (dom.globalAudioPlayer && dom.globalAudioPlayer.src) {
      dom.globalAudioPlayer.play().then(() => {
        state.isPlayingMusic = true;
        updatePlayingStateUI(true);
      }).catch(err => {
        console.warn('Playback prevented by browser autoplay policy:', err);
      });
    }
  }

  function pauseAudio() {
    if (dom.globalAudioPlayer) {
      dom.globalAudioPlayer.pause();
    }
    stopAmbientSound();
    state.isPlayingMusic = false;
    updatePlayingStateUI(false);
  }

  function stopAudio() {
    pauseAudio();
    if (dom.globalAudioPlayer) {
      dom.globalAudioPlayer.currentTime = 0;
    }
  }

  function nextTrack() {
    if (state.playlist.length === 0) return;
    let nextIdx = state.currentTrackIndex + 1;
    if (nextIdx >= state.playlist.length) nextIdx = 0;
    loadTrack(nextIdx, true);
  }

  function prevTrack() {
    if (state.playlist.length === 0) return;
    let prevIdx = state.currentTrackIndex - 1;
    if (prevIdx < 0) prevIdx = state.playlist.length - 1;
    loadTrack(prevIdx, true);
  }

  function removeTrackFromPlaylist(index) {
    if (index < 0 || index >= state.playlist.length) return;

    const removed = state.playlist.splice(index, 1)[0];
    if (removed && removed.url && removed.url.startsWith('blob:')) {
      URL.revokeObjectURL(removed.url);
    }

    if (state.currentTrackIndex === index) {
      stopAudio();
      if (state.playlist.length > 0) {
        loadTrack(Math.min(index, state.playlist.length - 1), false);
      } else {
        state.currentTrackIndex = -1;
        updatePlayerUI(null);
      }
    } else if (state.currentTrackIndex > index) {
      state.currentTrackIndex--;
    }

    renderPlaylist();
  }

  function updatePlayerUI(track) {
    if (!track) {
      if (dom.playerTrackTitle) dom.playerTrackTitle.textContent = 'No track playing';
      if (dom.playerTrackSource) dom.playerTrackSource.textContent = 'Select music from device or use Ambience';
      if (dom.focusMusicTitle) dom.focusMusicTitle.textContent = 'No music playing';
      return;
    }

    if (dom.playerTrackTitle) dom.playerTrackTitle.textContent = track.title;
    if (dom.playerTrackSource) dom.playerTrackSource.textContent = track.isAmbient ? 'Instant Ambience Generator' : 'Local Device Audio';
    if (dom.focusMusicTitle) dom.focusMusicTitle.textContent = track.title;
  }

  function updatePlayingStateUI(isPlaying) {
    if (dom.playerPlayPauseBtn) dom.playerPlayPauseBtn.textContent = isPlaying ? '⏸' : '▶';
    if (dom.focusMusicPlayBtn) dom.focusMusicPlayBtn.textContent = isPlaying ? '⏸' : '▶';
    if (dom.playerEqualizer) dom.playerEqualizer.style.display = isPlaying ? 'flex' : 'none';
    if (dom.playerArtIcon) dom.playerArtIcon.style.display = isPlaying ? 'none' : 'block';
  }

  // --- Instant Ambient Focus Sounds Generator (Web Audio API) ---
  function toggleAmbientSound(type) {
    initWebAudioContext();

    if (state.activeAmbientType === type && state.isPlayingMusic) {
      stopAmbientSound();
      state.isPlayingMusic = false;
      updatePlayingStateUI(false);
      return;
    }

    // Stop regular audio if playing
    if (dom.globalAudioPlayer) {
      dom.globalAudioPlayer.pause();
    }
    stopAmbientSound();

    state.activeAmbientType = type;
    state.isPlayingMusic = true;

    const names = {
      rain: '🌧️ Gentle Rain Ambience',
      lofi: '☕ Lo-Fi Vinyl Crackle',
      'white-noise': '🌊 Deep White Noise',
      binaural: '🧠 40Hz Alpha Focus Waves'
    };

    const trackObj = {
      id: 'ambient-' + type,
      title: names[type] || 'Focus Ambience',
      isAmbient: true
    };

    updatePlayerUI(trackObj);
    updatePlayingStateUI(true);

    // Update ambient buttons
    dom.ambientBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.ambient === type);
    });

    playSynthesizedAmbience(type);
    showToast(`Playing ${names[type] || 'Ambience'}`);
  }

  function playSynthesizedAmbience(type) {
    if (!webAudioCtx) return;

    try {
      if (type === 'white-noise') {
        // Noise buffer
        const bufferSize = webAudioCtx.sampleRate * 2;
        const buffer = webAudioCtx.createBuffer(1, bufferSize, webAudioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = webAudioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = webAudioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const gain = webAudioCtx.createGain();
        gain.gain.value = state.musicVolume * 0.15;

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(webAudioCtx.destination);
        noise.start();

        state.ambientAudioNode = { noise, gain };

      } else if (type === 'binaural') {
        // Binaural beat: 216Hz Left, 226Hz Right (10Hz Alpha beat)
        const osc = webAudioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 216;

        const gain = webAudioCtx.createGain();
        gain.gain.value = state.musicVolume * 0.12;

        osc.connect(gain);
        gain.connect(webAudioCtx.destination);
        osc.start();

        state.ambientAudioNode = { osc, gain };

      } else {
        // Rain / Lo-fi Pink-filtered noise
        const bufferSize = webAudioCtx.sampleRate * 2;
        const buffer = webAudioCtx.createBuffer(1, bufferSize, webAudioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          data[i] = (b0 + b1 + b2) * 0.3;
        }

        const noise = webAudioCtx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const gain = webAudioCtx.createGain();
        gain.gain.value = state.musicVolume * 0.15;

        noise.connect(gain);
        gain.connect(webAudioCtx.destination);
        noise.start();

        state.ambientAudioNode = { noise, gain };
      }
    } catch (err) {
      console.warn('Synthesized ambience error:', err);
    }
  }

  function stopAmbientSound() {
    if (state.ambientAudioNode) {
      try {
        if (state.ambientAudioNode.noise) state.ambientAudioNode.noise.stop();
        if (state.ambientAudioNode.osc) state.ambientAudioNode.osc.stop();
      } catch (e) {}
      state.ambientAudioNode = null;
    }
    state.activeAmbientType = null;
    dom.ambientBtns.forEach(btn => btn.classList.remove('active'));
  }

  // =========================================================================
  // 14. FOCUS MODE
  // =========================================================================
  function enterFocusMode() {
    state.isFocusMode = true;
    if (dom.focusModeOverlay) dom.focusModeOverlay.style.display = 'flex';
    updateFocusTaskSelector();
    renderTimerDisplay();
  }

  function exitFocusMode() {
    state.isFocusMode = false;
    if (dom.focusModeOverlay) dom.focusModeOverlay.style.display = 'none';
  }

  function updateFocusTaskSelector() {
    if (!dom.focusTaskSelect) return;
    const pendingTasks = state.tasks.filter(t => t.status === 'pending');

    dom.focusTaskSelect.innerHTML = `
      <option value="">General Study Session</option>
      ${pendingTasks.map(t => `<option value="${t.id}" ${state.timerActiveTaskId === t.id ? 'selected' : ''}>[${escapeHtml(t.subject)}] ${escapeHtml(t.title)}</option>`).join('')}
    `;

    updateActiveTaskDisplay();
  }

  function selectTaskForFocus(taskId) {
    state.timerActiveTaskId = taskId;
    updateFocusTaskSelector();
    enterFocusMode();
  }

  function updateActiveTaskDisplay() {
    const activeTask = state.tasks.find(t => t.id === state.timerActiveTaskId);
    const text = activeTask ? `Working on: ${activeTask.title}` : 'No specific task selected';

    if (dom.timerCurrentTaskText) dom.timerCurrentTaskText.textContent = text;
    if (dom.focusTimerTaskDisplay) dom.focusTimerTaskDisplay.textContent = activeTask ? activeTask.title : 'General Study Session';
  }

  // =========================================================================
  // 14. TASK REMINDER & NOTIFICATION SYSTEM (SECTIONS 42 - 69)
  // =========================================================================

  // 1. Service Worker Initialization (Section 61)
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('✅ ServiceWorker registered with scope:', registration.scope);
          state.serviceWorkerReg = registration;
          syncPushSubscription();
        })
        .catch(err => {
          console.warn('ServiceWorker registration error:', err);
        });
    }
  }

  // 2. Web Push Subscription Sync (Section 61)
  async function syncPushSubscription() {
    if (!state.serviceWorkerReg || !('PushManager' in window) || !state.user || state.isDemoMode) return;
    try {
      const sub = await state.serviceWorkerReg.pushManager.getSubscription();
      if (sub && window.supabaseClient) {
        const subJson = sub.toJSON();
        await window.supabaseClient.from('push_subscriptions').upsert({
          user_id: state.user.id,
          endpoint: sub.endpoint,
          p256dh: subJson.keys?.p256dh || '',
          auth: subJson.keys?.auth || '',
          updated_at: new Date().toISOString()
        }, { onConflict: 'endpoint' });
      }
    } catch (err) {
      console.warn('Push subscription sync notice:', err);
    }
  }

  // 3. Browser Notification Status UI (Section 59)
  function updateBrowserNotificationStatusUI() {
    if (!('Notification' in window)) {
      if (dom.notifPermissionIcon) dom.notifPermissionIcon.textContent = '⚪';
      if (dom.notifPermissionStatusText) dom.notifPermissionStatusText.textContent = 'Not Supported';
      if (dom.requestNotifPermissionModalBtn) dom.requestNotifPermissionModalBtn.style.display = 'none';
      return;
    }

    const permission = Notification.permission;
    if (permission === 'granted') {
      if (dom.notifPermissionIcon) dom.notifPermissionIcon.textContent = '🟢';
      if (dom.notifPermissionStatusText) dom.notifPermissionStatusText.textContent = 'Enabled';
      if (dom.requestNotifPermissionModalBtn) {
        dom.requestNotifPermissionModalBtn.textContent = '✓ Permission Granted';
        dom.requestNotifPermissionModalBtn.disabled = true;
      }
      if (dom.notifBlockedHelpText) dom.notifBlockedHelpText.style.display = 'none';
      if (dom.permissionPromptCard) dom.permissionPromptCard.style.display = 'none';
    } else if (permission === 'denied') {
      if (dom.notifPermissionIcon) dom.notifPermissionIcon.textContent = '🔴';
      if (dom.notifPermissionStatusText) dom.notifPermissionStatusText.textContent = 'Blocked';
      if (dom.requestNotifPermissionModalBtn) {
        dom.requestNotifPermissionModalBtn.textContent = 'Blocked by Browser';
        dom.requestNotifPermissionModalBtn.disabled = true;
      }
      if (dom.notifBlockedHelpText) dom.notifBlockedHelpText.style.display = 'block';
      if (dom.permissionPromptCard) dom.permissionPromptCard.style.display = 'none';
    } else {
      // 'default'
      if (dom.notifPermissionIcon) dom.notifPermissionIcon.textContent = '🟡';
      if (dom.notifPermissionStatusText) dom.notifPermissionStatusText.textContent = 'Permission Required';
      if (dom.requestNotifPermissionModalBtn) {
        dom.requestNotifPermissionModalBtn.textContent = 'Request Permission';
        dom.requestNotifPermissionModalBtn.disabled = false;
      }
      if (dom.notifBlockedHelpText) dom.notifBlockedHelpText.style.display = 'none';
    }
  }

  // 4. Soft Browser Notification Permission Check (Section 44)
  function checkPromptSoftPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && !localStorage.getItem('studyflow_notif_prompt_dismissed')) {
      if (dom.permissionPromptCard) {
        dom.permissionPromptCard.style.display = 'flex';
      }
    }
  }

  // 5. Request Permission Handler (Section 44 & 59)
  async function requestBrowserNotificationPermission(source = 'button') {
    if (!('Notification' in window)) {
      showToast('Browser notifications are not supported in your browser.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      updateBrowserNotificationStatusUI();

      if (permission === 'granted') {
        showToast('🔔 Browser notifications enabled! You will receive deadline alerts.', 'success');
        if (dom.permissionPromptCard) dom.permissionPromptCard.style.display = 'none';
        
        // Show test greeting notification
        showBrowserNotification('🎓 StudyFlow Notifications Active', {
          body: 'You are all set! We will remind you when deadlines approach.',
          tag: 'welcome-notification'
        });

        syncPushSubscription();
      } else if (permission === 'denied') {
        showToast('Browser notifications were blocked. Reminders will continue in-app.', 'info');
        if (dom.permissionPromptCard) dom.permissionPromptCard.style.display = 'none';
      }
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
    }
  }

  // 6. Notification Sound Synthesizer (Section 60)
  function playNotificationAlertSound() {
    if (!state.settings.notification_sound) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!webAudioCtx) {
        webAudioCtx = new AudioCtx();
      }
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => {});
      }
      const now = webAudioCtx.currentTime;

      // Primary chime tone (D5 ~ 587Hz)
      const osc1 = webAudioCtx.createOscillator();
      const gain1 = webAudioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(webAudioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Higher harmonic bell tone (A5 ~ 880Hz)
      const osc2 = webAudioCtx.createOscillator();
      const gain2 = webAudioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.15, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(webAudioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } catch (err) {
      // Audio autoplay restrictions safely caught
    }
  }

  // 7. Dispatch Browser Notification (Sections 44, 45, 61)
  function showBrowserNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      if (state.serviceWorkerReg && 'showNotification' in state.serviceWorkerReg) {
        state.serviceWorkerReg.showNotification(title, {
          icon: './favicon.ico',
          badge: './favicon.ico',
          tag: options.tag || 'deadline-alert',
          renotify: false,
          ...options
        });
      } else {
        new Notification(title, {
          icon: './favicon.ico',
          ...options
        });
      }
    } catch (err) {
      console.warn('Browser notification display error:', err);
    }
  }

  // 8. Automatic Deadline Monitor Engine (Sections 42-49, 64-67)
  async function checkDeadlinesAndTriggerReminders() {
    if (!state.tasks || state.tasks.length === 0) {
      updateDeadlineBanner();
      renderNeedsAttention();
      renderUpcomingDeadlines();
      return;
    }

    const pendingTasks = state.tasks.filter(t => t.status !== 'completed' && t.due_date);

    for (const task of pendingTasks) {
      const daysDiff = getDaysDifference(task.due_date);
      let reminderType = null;
      let title = '';
      let message = '';
      let notificationType = 'upcoming';
      let urgencyLevel = 'low';

      if (daysDiff < 0) {
        // OVERDUE (Critical - Mandatory, Section 43)
        reminderType = 'overdue';
        urgencyLevel = 'critical';
        title = '⛔ Overdue Task';
        message = `Your "${task.title}" assignment is overdue.`;
        notificationType = 'overdue';
      } else if (daysDiff === 0) {
        // DUE TODAY (Critical - Mandatory, Section 43)
        reminderType = 'due_today';
        urgencyLevel = 'critical';
        title = '🚨 Task Due Today';
        message = `"${task.title}" is due today.`;
        notificationType = 'due_today';
      } else if (daysDiff === 1) {
        // 1 DAY BEFORE / TOMORROW (High urgency)
        if (state.settings.reminder_1_day !== false) {
          reminderType = '1_day';
          urgencyLevel = 'high';
          title = '🚨 Task Due Tomorrow';
          message = `"${task.title}" is due tomorrow.`;
          notificationType = 'upcoming';
        }
      } else if (daysDiff === 3) {
        // 3 DAYS BEFORE (Medium urgency)
        if (state.settings.reminder_3_days !== false) {
          reminderType = '3_days';
          urgencyLevel = 'medium';
          title = '⚠️ Task Due in 3 Days';
          message = `"${task.title}" is due in 3 days.`;
          notificationType = 'upcoming';
        }
      } else if (daysDiff === 7) {
        // 7 DAYS BEFORE (Low urgency)
        if (state.settings.reminder_7_days !== false) {
          reminderType = '7_days';
          urgencyLevel = 'low';
          title = '📚 Task Deadline Approaching';
          message = `Task deadline approaching: "${task.title}" is due in 7 days.`;
          notificationType = 'upcoming';
        }
      }

      if (reminderType) {
        const reminderKey = `${task.id}_${reminderType}`;
        // Section 47 & 48: Prevent duplicate reminders
        if (!state.sentReminders.has(reminderKey)) {
          await triggerTaskReminder(task, reminderType, title, message, notificationType, urgencyLevel);
        }
      }
    }

    // Refresh UI components
    updateDeadlineBanner();
    renderNeedsAttention();
    renderUpcomingDeadlines();
    renderNotificationCenter();
  }

  // 9. Trigger & Record Task Reminder (Sections 48, 49, 52)
  async function triggerTaskReminder(task, reminderType, title, message, notificationType, urgencyLevel) {
    const reminderKey = `${task.id}_${reminderType}`;
    state.sentReminders.add(reminderKey);

    const notifItem = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      user_id: state.user?.id || 'demo-user',
      task_id: task.id,
      title,
      message,
      notification_type: notificationType,
      is_read: false,
      created_at: new Date().toISOString()
    };

    state.notifications.unshift(notifItem);

    // Save reminder & notification to Supabase database (Section 48, 49, 52)
    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        // 1. Record in task_reminders
        await window.supabaseClient.from('task_reminders').insert({
          task_id: task.id,
          user_id: state.user.id,
          reminder_type: reminderType,
          sent_at: new Date().toISOString()
        });

        // 2. Record in notifications
        const { data } = await window.supabaseClient.from('notifications').insert({
          user_id: state.user.id,
          task_id: task.id,
          title,
          message,
          notification_type: notificationType,
          is_read: false
        }).select().single();

        if (data) {
          notifItem.id = data.id;
        }
      } catch (err) {
        console.warn('Could not record reminder in Supabase:', err);
      }
    }

    // Play notification sound if enabled
    playNotificationAlertSound();

    // Show browser notification if permission granted
    showBrowserNotification(title, {
      body: message,
      tag: `task-${task.id}-${reminderType}`
    });

    // Animate bell badge pulse
    if (dom.notificationBadge) {
      dom.notificationBadge.classList.add('badge-pulse');
      setTimeout(() => dom.notificationBadge.classList.remove('badge-pulse'), 1500);
    }
  }

  // 10. In-App Critical Deadline Banner (Section 53)
  function updateDeadlineBanner() {
    if (!dom.deadlineReminderBanner) return;

    // Find the most critical pending deadline (Overdue, Due Today, Due Tomorrow)
    const pendingTasks = state.tasks.filter(t => t.status !== 'completed' && t.due_date);
    if (pendingTasks.length === 0) {
      dom.deadlineReminderBanner.style.display = 'none';
      state.activeBannerTaskId = null;
      return;
    }

    // Sort by daysDiff ascending (overdue first, then today, then tomorrow)
    const sorted = [...pendingTasks].sort((a, b) => getDaysDifference(a.due_date) - getDaysDifference(b.due_date));
    const mostCritical = sorted[0];
    const daysDiff = getDaysDifference(mostCritical.due_date);

    // Only show banner for critical deadlines: overdue, today, or tomorrow
    if (daysDiff > 1) {
      dom.deadlineReminderBanner.style.display = 'none';
      state.activeBannerTaskId = null;
      return;
    }

    // Check if dismissed in this session
    if (state.dismissedBannerTaskIds.has(mostCritical.id)) {
      dom.deadlineReminderBanner.style.display = 'none';
      return;
    }

    state.activeBannerTaskId = mostCritical.id;

    if (daysDiff < 0) {
      dom.bannerUrgencyIcon.textContent = '⛔';
      dom.bannerUrgencyTag.textContent = 'OVERDUE DEADLINE';
      dom.bannerUrgencyTag.className = 'banner-urgency-tag urgency-tag-critical';
      dom.bannerTimeTag.textContent = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'}`;
    } else if (daysDiff === 0) {
      dom.bannerUrgencyIcon.textContent = '🚨';
      dom.bannerUrgencyTag.textContent = 'CRITICAL: DUE TODAY';
      dom.bannerUrgencyTag.className = 'banner-urgency-tag urgency-tag-critical';
      dom.bannerTimeTag.textContent = 'Due Today at 11:59 PM';
    } else {
      dom.bannerUrgencyIcon.textContent = '⏳';
      dom.bannerUrgencyTag.textContent = 'DEADLINE APPROACHING';
      dom.bannerUrgencyTag.className = 'banner-urgency-tag urgency-tag-urgent';
      dom.bannerTimeTag.textContent = 'Due Tomorrow at 11:59 PM';
    }

    dom.bannerTaskTitle.textContent = mostCritical.title;
    dom.bannerTaskSubtext.textContent = `${mostCritical.subject || 'Academic Task'} · Due on ${formatDisplayDate(mostCritical.due_date)}`;
    dom.deadlineReminderBanner.style.display = 'flex';
  }

  // 11. "Needs Attention" Dashboard Widget (Section 55)
  function renderNeedsAttention() {
    if (!dom.needsAttentionList || !dom.needsAttentionCountBadge) return;

    // Tasks due today, tomorrow, or overdue (status !== completed)
    const urgentTasks = state.tasks.filter(t => {
      if (t.status === 'completed' || !t.due_date) return false;
      const diff = getDaysDifference(t.due_date);
      return diff <= 1; // overdue (< 0), today (0), tomorrow (1)
    }).sort((a, b) => getDaysDifference(a.due_date) - getDaysDifference(b.due_date));

    dom.needsAttentionCountBadge.textContent = `${urgentTasks.length} urgent`;
    if (urgentTasks.length > 0) {
      dom.needsAttentionCountBadge.className = 'card-pill-tag tag-urgent';
    } else {
      dom.needsAttentionCountBadge.className = 'card-pill-tag tag-success';
    }

    if (urgentTasks.length === 0) {
      dom.needsAttentionList.innerHTML = `
        <div class="all-caught-up-box">
          <span class="caught-up-emoji">🎉</span>
          <h4>You're all caught up!</h4>
          <p>No urgent deadlines due today, tomorrow, or overdue.</p>
        </div>
      `;
      return;
    }

    dom.needsAttentionList.innerHTML = urgentTasks.map(task => {
      const diff = getDaysDifference(task.due_date);
      let badgeClass = 'badge-urgent';
      let badgeLabel = 'Due Tomorrow';
      let dotClass = 'dot-urgent';

      if (diff < 0) {
        badgeClass = 'badge-overdue';
        badgeLabel = `Overdue ${Math.abs(diff)}d`;
        dotClass = 'dot-critical';
      } else if (diff === 0) {
        badgeClass = 'badge-today';
        badgeLabel = 'Due Today';
        dotClass = 'dot-critical';
      }

      return `
        <div class="urgent-task-item" data-id="${task.id}">
          <span class="urgent-urgency-dot ${dotClass}"></span>
          <div class="urgent-task-info">
            <h4 class="urgent-task-title">${escapeHtml(task.title)}</h4>
            <div class="urgent-task-meta">
              <span class="urgent-subject-tag">${escapeHtml(task.subject || 'General')}</span>
              <span class="urgent-deadline-badge ${badgeClass}">${badgeLabel}</span>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm btn-urgent-focus" data-id="${task.id}" title="Focus on this task">
            🎯 Focus
          </button>
        </div>
      `;
    }).join('');

    dom.needsAttentionList.querySelectorAll('.btn-urgent-focus').forEach(btn => {
      btn.addEventListener('click', (e) => {
        selectTaskForFocus(e.currentTarget.dataset.id);
      });
    });

    dom.needsAttentionList.querySelectorAll('.urgent-task-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.btn-urgent-focus')) return;
        window.location.hash = '#tasks';
        const card = document.querySelector(`.task-card[data-id="${item.dataset.id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('task-card-highlight');
          setTimeout(() => card.classList.remove('task-card-highlight'), 2500);
        }
      });
    });
  }

  // 12. "Upcoming Deadlines" Dashboard Widget (Section 54)
  function renderUpcomingDeadlines() {
    if (!dom.upcomingDeadlinesList) return;

    // Non-completed tasks with future/today deadlines
    const upcomingTasks = state.tasks
      .filter(t => t.status !== 'completed' && t.due_date && getDaysDifference(t.due_date) >= 0)
      .sort((a, b) => getDaysDifference(a.due_date) - getDaysDifference(b.due_date))
      .slice(0, 5);

    if (upcomingTasks.length === 0) {
      dom.upcomingDeadlinesList.innerHTML = `<p class="sessions-empty-text">No upcoming deadlines scheduled.</p>`;
      return;
    }

    dom.upcomingDeadlinesList.innerHTML = upcomingTasks.map(task => {
      const diff = getDaysDifference(task.due_date);
      let dotClass = 'dot-normal';
      let timeText = `In ${diff} days`;

      if (diff === 0) {
        dotClass = 'dot-critical';
        timeText = 'Today · 11:59 PM';
      } else if (diff === 1) {
        dotClass = 'dot-urgent';
        timeText = 'Tomorrow · 11:59 PM';
      } else if (diff <= 3) {
        dotClass = 'dot-approaching';
        timeText = `In ${diff} days`;
      }

      return `
        <div class="upcoming-deadline-row" data-id="${task.id}">
          <span class="deadline-dot ${dotClass}"></span>
          <div class="deadline-row-info">
            <span class="deadline-row-title">${escapeHtml(task.title)}</span>
            <span class="deadline-row-subj">${escapeHtml(task.subject || 'General')}</span>
          </div>
          <span class="deadline-row-time">${timeText}</span>
        </div>
      `;
    }).join('');

    dom.upcomingDeadlinesList.querySelectorAll('.upcoming-deadline-row').forEach(row => {
      row.addEventListener('click', () => {
        window.location.hash = '#tasks';
        const card = document.querySelector(`.task-card[data-id="${row.dataset.id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.add('task-card-highlight');
          setTimeout(() => card.classList.remove('task-card-highlight'), 2500);
        }
      });
    });
  }

  // 13. In-App Notification Center Rendering (Sections 50-52)
  function renderNotificationCenter() {
    const unreadCount = state.notifications.filter(n => !n.is_read).length;

    // Bell Badge
    if (dom.notificationBadge) {
      if (unreadCount > 0) {
        dom.notificationBadge.style.display = 'inline-block';
        dom.notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      } else {
        dom.notificationBadge.style.display = 'none';
      }
    }

    // Panel Header Count
    if (dom.notifUnreadCountBadge) {
      dom.notifUnreadCountBadge.textContent = `${unreadCount} new`;
    }

    // Notification Items List
    if (!dom.notificationItemsList) return;

    if (state.notifications.length === 0) {
      dom.notificationItemsList.innerHTML = `
        <div class="notif-empty-state">
          <span class="notif-empty-icon">✨</span>
          <p>No notifications yet. Approaching deadlines will appear here.</p>
        </div>
      `;
      return;
    }

    const typeIcons = {
      due_today: '🚨',
      overdue: '⛔',
      upcoming: '📚',
      study_reminder: '⏱️',
      system: '📢'
    };

    dom.notificationItemsList.innerHTML = state.notifications.map(n => {
      const isUnread = !n.is_read;
      const icon = typeIcons[n.notification_type] || '🔔';
      const timeStr = formatRelativeTime(n.created_at);

      return `
        <div class="notif-item ${isUnread ? 'notif-unread' : ''}" data-id="${n.id}" data-task-id="${n.task_id || ''}">
          <span class="notif-item-icon">${icon}</span>
          <div class="notif-item-body">
            <h5 class="notif-item-title">${escapeHtml(n.title)}</h5>
            <p class="notif-item-msg">${escapeHtml(n.message)}</p>
            <span class="notif-item-time">${timeStr}</span>
          </div>
          ${isUnread ? `<button type="button" class="notif-mark-single-btn" data-id="${n.id}" title="Mark as read">✓</button>` : ''}
        </div>
      `;
    }).join('');

    // Attach mark single read listeners
    dom.notificationItemsList.querySelectorAll('.notif-mark-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        markNotificationAsRead(btn.dataset.id);
      });
    });

    // Clicking notification item marks as read and navigates to task
    dom.notificationItemsList.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const notifId = item.dataset.id;
        const taskId = item.dataset.taskId;
        markNotificationAsRead(notifId);

        if (taskId) {
          if (dom.notificationPanel) dom.notificationPanel.style.display = 'none';
          window.location.hash = '#tasks';
          const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('task-card-highlight');
            setTimeout(() => card.classList.remove('task-card-highlight'), 2500);
          }
        }
      });
    });
  }

  function formatRelativeTime(isoString) {
    if (!isoString) return 'Recently';
    const now = Date.now();
    const created = new Date(isoString).getTime();
    const diffSecs = Math.floor((now - created) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} min ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} hour${Math.floor(diffSecs / 3600) === 1 ? '' : 's'} ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // 14. Mark Notification Read / Mark All (Section 51)
  async function markNotificationAsRead(notifId) {
    const notif = state.notifications.find(n => n.id === notifId);
    if (!notif || notif.is_read) return;

    notif.is_read = true;

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        await window.supabaseClient
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notifId)
          .eq('user_id', state.user.id);
      } catch (err) {
        console.warn('Could not mark notification as read in Supabase:', err);
      }
    }

    renderNotificationCenter();
  }

  async function markAllNotificationsAsRead() {
    state.notifications.forEach(n => { n.is_read = true; });

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        await window.supabaseClient
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', state.user.id)
          .eq('is_read', false);
      } catch (err) {
        console.warn('Could not mark all notifications read in Supabase:', err);
      }
    }

    renderNotificationCenter();
    showToast('All notifications marked as read.', 'info');
  }

  // 15. Notification & Reminder Settings Modal (Sections 58, 59, 64)
  function openNotificationSettingsModal() {
    if (!dom.notificationSettingsModal) return;

    updateBrowserNotificationStatusUI();

    if (dom.settingNotifSound) dom.settingNotifSound.checked = state.settings.notification_sound !== false;
    if (dom.settingTiming7Days) dom.settingTiming7Days.checked = state.settings.reminder_7_days !== false;
    if (dom.settingTiming3Days) dom.settingTiming3Days.checked = state.settings.reminder_3_days !== false;
    if (dom.settingTiming1Day) dom.settingTiming1Day.checked = state.settings.reminder_1_day !== false;
    if (dom.settingTimingDueToday) {
      dom.settingTimingDueToday.checked = true;
      dom.settingTimingDueToday.disabled = true; // Mandatory
    }
    if (dom.settingTimingOverdue) {
      dom.settingTimingOverdue.checked = true;
      dom.settingTimingOverdue.disabled = true; // Mandatory
    }

    populateTimezoneOptions();
    dom.notificationSettingsModal.style.display = 'flex';
  }

  function closeNotificationSettingsModal() {
    if (dom.notificationSettingsModal) dom.notificationSettingsModal.style.display = 'none';
  }

  function populateTimezoneOptions() {
    if (!dom.settingTimezoneSelect) return;
    const currentTz = state.settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const commonZones = [
      'UTC',
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Dubai',
      'Asia/Kolkata',
      'Asia/Singapore',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];

    if (!commonZones.includes(currentTz)) {
      commonZones.unshift(currentTz);
    }

    dom.settingTimezoneSelect.innerHTML = commonZones.map(tz => `
      <option value="${tz}" ${tz === currentTz ? 'selected' : ''}>${tz}</option>
    `).join('');
  }

  async function saveNotificationSettings() {
    const soundEnabled = dom.settingNotifSound ? dom.settingNotifSound.checked : true;
    const timing7 = dom.settingTiming7Days ? dom.settingTiming7Days.checked : true;
    const timing3 = dom.settingTiming3Days ? dom.settingTiming3Days.checked : true;
    const timing1 = dom.settingTiming1Day ? dom.settingTiming1Day.checked : true;
    const selectedTz = dom.settingTimezoneSelect ? dom.settingTimezoneSelect.value : (state.settings.timezone || 'UTC');

    state.settings.notification_sound = soundEnabled;
    state.settings.reminder_7_days = timing7;
    state.settings.reminder_3_days = timing3;
    state.settings.reminder_1_day = timing1;
    state.settings.reminder_due_today = true; // Locked
    state.settings.reminder_overdue = true;   // Locked
    state.settings.timezone = selectedTz;

    if (!state.isDemoMode && window.supabaseClient && state.user) {
      try {
        await window.supabaseClient.from('user_settings').upsert({
          user_id: state.user.id,
          notification_sound: soundEnabled,
          reminder_7_days: timing7,
          reminder_3_days: timing3,
          reminder_1_day: timing1,
          reminder_due_today: true,
          reminder_overdue: true,
          timezone: selectedTz,
          updated_at: new Date().toISOString()
        });

        await window.supabaseClient.from('profiles').update({
          timezone: selectedTz
        }).eq('user_id', state.user.id);

      } catch (err) {
        console.warn('Could not save notification settings to Supabase:', err);
      }
    }

    closeNotificationSettingsModal();
    showToast('✓ Notification settings saved!', 'success');

    // Re-check deadlines immediately with updated timing preferences
    checkDeadlinesAndTriggerReminders();
    renderAllViews();
  }

  // =========================================================================
  // 15. MODALS & FORMS
  // =========================================================================
  function openAddTaskModal(prefilledDate = null) {
    if (!dom.taskModalBackdrop) return;
    dom.taskForm.reset();
    dom.taskFormId.value = '';
    dom.taskModalTitle.textContent = '➕ Add New Task';

    // Set default or prefilled due date
    const todayStr = formatDateKey(new Date());
    dom.taskDueDateInput.value = prefilledDate || state.selectedCalendarDateStr || todayStr;
    dom.taskPrioritySelect.value = 'medium';
    dom.taskStatusSelect.value = 'pending';

    dom.taskTitleError.style.display = 'none';
    dom.taskSubjectError.style.display = 'none';
    dom.taskDueDateError.style.display = 'none';

    dom.taskModalBackdrop.style.display = 'flex';
    dom.taskTitleInput.focus();
  }

  function openEditTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !dom.taskModalBackdrop) return;

    dom.taskFormId.value = task.id;
    dom.taskModalTitle.textContent = '✏️ Edit Task';
    dom.taskTitleInput.value = task.title;
    dom.taskSubjectInput.value = task.subject;
    dom.taskDescriptionInput.value = task.description || '';
    dom.taskDueDateInput.value = task.due_date;
    dom.taskPrioritySelect.value = task.priority;
    dom.taskStatusSelect.value = task.status;

    dom.taskTitleError.style.display = 'none';
    dom.taskSubjectError.style.display = 'none';
    dom.taskDueDateError.style.display = 'none';

    dom.taskModalBackdrop.style.display = 'flex';
    dom.taskTitleInput.focus();
  }

  function closeTaskModal() {
    if (dom.taskModalBackdrop) dom.taskModalBackdrop.style.display = 'none';
  }

  function openDeleteTaskModal(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !dom.deleteModalBackdrop) return;

    state.pendingDeleteTaskId = taskId;
    if (dom.deleteTaskTitlePreview) {
      dom.deleteTaskTitlePreview.textContent = `"${task.title}"`;
    }
    dom.deleteModalBackdrop.style.display = 'flex';
  }

  function closeDeleteModal() {
    state.pendingDeleteTaskId = null;
    if (dom.deleteModalBackdrop) dom.deleteModalBackdrop.style.display = 'none';
  }

  function openProfileModal() {
    if (!dom.profileModalBackdrop) return;
    dom.profileFullNameInput.value = state.profile.full_name;
    dom.profileAvatarChoice.value = state.profile.avatar_url;
    dom.profileStudyGoalInput.value = state.profile.study_goal;

    document.querySelectorAll('.avatar-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.avatar === state.profile.avatar_url);
    });

    dom.profileModalBackdrop.style.display = 'flex';
  }

  function closeProfileModal() {
    if (dom.profileModalBackdrop) dom.profileModalBackdrop.style.display = 'none';
  }

  function openSupabaseSettingsModal() {
    if (!dom.supabaseSettingsModal) return;
    const config = window.studyflowConfig ? window.studyflowConfig.getSupabaseConfig() : { url: '', anonKey: '' };
    dom.cfgSupabaseUrl.value = config.url || '';
    dom.cfgSupabaseKey.value = config.anonKey || '';
    dom.connectionTestResult.style.display = 'none';
    dom.supabaseSettingsModal.style.display = 'flex';
  }

  function closeSupabaseSettingsModal() {
    if (dom.supabaseSettingsModal) dom.supabaseSettingsModal.style.display = 'none';
  }

  // =========================================================================
  // 16. THEME TOGGLE (DARK / LIGHT MODE)
  // =========================================================================
  function applyTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    if (dom.themeIcon) {
      dom.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    localStorage.setItem('studyflow_theme', theme);
  }

  function toggleTheme() {
    const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);

    // Save to Supabase user_settings if authenticated
    if (!state.isDemoMode && window.supabaseClient && state.user) {
      window.supabaseClient
        .from('user_settings')
        .upsert({ user_id: state.user.id, theme: newTheme, updated_at: new Date().toISOString() })
        .then(() => {})
        .catch(err => console.warn('Could not save theme preference:', err));
    }
  }

  // =========================================================================
  // 17. EVENT LISTENERS SETUP
  // =========================================================================
  function setupEventListeners() {
    // Auth Forms
    if (dom.loginForm) dom.loginForm.addEventListener('submit', performLogin);
    if (dom.signupForm) dom.signupForm.addEventListener('submit', performSignUp);
    if (dom.forgotForm) dom.forgotForm.addEventListener('submit', performForgotPassword);

    // Auth screen transitions
    if (dom.toSignUpBtn) dom.toSignUpBtn.addEventListener('click', () => showAuthOverlay('signup'));
    if (dom.toLoginFromSignupBtn) dom.toLoginFromSignupBtn.addEventListener('click', () => showAuthOverlay('login'));
    if (dom.toForgotPasswordBtn) dom.toForgotPasswordBtn.addEventListener('click', () => showAuthOverlay('forgot'));
    if (dom.toLoginFromForgotBtn) dom.toLoginFromForgotBtn.addEventListener('click', () => showAuthOverlay('login'));
    if (dom.demoModeBtn) dom.demoModeBtn.addEventListener('click', startDemoMode);
    if (dom.authOpenConfigBtn) dom.authOpenConfigBtn.addEventListener('click', openSupabaseSettingsModal);

    // Password visibility toggles
    const toggleLoginPw = document.getElementById('toggleLoginPasswordBtn');
    if (toggleLoginPw) {
      toggleLoginPw.addEventListener('click', () => {
        dom.loginPassword.type = dom.loginPassword.type === 'password' ? 'text' : 'password';
      });
    }
    const toggleSignupPw = document.getElementById('toggleSignupPasswordBtn');
    if (toggleSignupPw) {
      toggleSignupPw.addEventListener('click', () => {
        dom.signupPassword.type = dom.signupPassword.type === 'password' ? 'text' : 'password';
      });
    }

    // Header & Nav
    if (dom.themeToggleBtn) dom.themeToggleBtn.addEventListener('click', toggleTheme);
    if (dom.headerFocusModeBtn) dom.headerFocusModeBtn.addEventListener('click', enterFocusMode);
    if (dom.heroStartFocusBtn) dom.heroStartFocusBtn.addEventListener('click', enterFocusMode);
    if (dom.playerFocusModeBtn) dom.playerFocusModeBtn.addEventListener('click', enterFocusMode);
    if (dom.exitFocusModeBtn) dom.exitFocusModeBtn.addEventListener('click', exitFocusMode);

    // Profile Dropdown Menu
    if (dom.profileDropdownBtn) {
      dom.profileDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dom.profileMenu.style.display === 'block';
        dom.profileMenu.style.display = isOpen ? 'none' : 'block';
      });
    }

    document.addEventListener('click', (e) => {
      if (dom.profileMenu && !dom.profileMenu.contains(e.target) && e.target !== dom.profileDropdownBtn) {
        dom.profileMenu.style.display = 'none';
      }
    });

    if (dom.menuEditProfileBtn) {
      dom.menuEditProfileBtn.addEventListener('click', () => {
        dom.profileMenu.style.display = 'none';
        openProfileModal();
      });
    }

    if (dom.menuNotifSettingsBtn) {
      dom.menuNotifSettingsBtn.addEventListener('click', () => {
        dom.profileMenu.style.display = 'none';
        openNotificationSettingsModal();
      });
    }

    if (dom.menuTimerSettingsBtn) {
      dom.menuTimerSettingsBtn.addEventListener('click', () => {
        dom.profileMenu.style.display = 'none';
        window.location.hash = '#timer';
        if (dom.timerSettingsBody) dom.timerSettingsBody.style.display = 'flex';
      });
    }

    if (dom.menuSupabaseConfigBtn) {
      dom.menuSupabaseConfigBtn.addEventListener('click', () => {
        dom.profileMenu.style.display = 'none';
        openSupabaseSettingsModal();
      });
    }

    if (dom.menuLogoutBtn) dom.menuLogoutBtn.addEventListener('click', performLogout);

    // Mobile Hamburger
    if (dom.mobileMenuBtn && dom.navMenu) {
      dom.mobileMenuBtn.addEventListener('click', () => {
        dom.navMenu.classList.toggle('nav-open');
      });
      dom.navLinks.forEach(link => {
        link.addEventListener('click', () => {
          dom.navMenu.classList.remove('nav-open');
        });
      });
    }

    // Task Creation & Modals
    if (dom.openAddModalBtn) dom.openAddModalBtn.addEventListener('click', () => openAddTaskModal());
    if (dom.openAddModalBtnSecondary) dom.openAddModalBtnSecondary.addEventListener('click', () => openAddTaskModal());
    if (dom.heroAddTaskBtn) dom.heroAddTaskBtn.addEventListener('click', () => openAddTaskModal());
    if (dom.emptyAddBtn) dom.emptyAddBtn.addEventListener('click', () => openAddTaskModal());
    if (dom.calAddTaskForDateBtn) dom.calAddTaskForDateBtn.addEventListener('click', () => openAddTaskModal(state.selectedCalendarDateStr));

    if (dom.taskModalCloseBtn) dom.taskModalCloseBtn.addEventListener('click', closeTaskModal);
    if (dom.taskModalCancelBtn) dom.taskModalCancelBtn.addEventListener('click', closeTaskModal);
    if (dom.taskForm) dom.taskForm.addEventListener('submit', saveTaskFromForm);

    if (dom.deleteModalCloseBtn) dom.deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
    if (dom.cancelDeleteBtn) dom.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (dom.confirmDeleteBtn) {
      dom.confirmDeleteBtn.addEventListener('click', () => {
        deleteTask(state.pendingDeleteTaskId);
      });
    }

    // Search & Filter
    if (dom.taskSearchInput) {
      dom.taskSearchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        renderTasksList();
      });
    }

    if (dom.clearSearchBtn) {
      dom.clearSearchBtn.addEventListener('click', () => {
        dom.taskSearchInput.value = '';
        state.searchQuery = '';
        renderTasksList();
      });
    }

    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        dom.filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');
        targetBtn.setAttribute('aria-selected', 'true');
        state.activeFilter = targetBtn.dataset.filter;
        renderTasksList();
      });
    });

    if (dom.taskSortSelect) {
      dom.taskSortSelect.addEventListener('change', (e) => {
        state.activeSort = e.target.value;
        renderTasksList();
      });
    }

    // Calendar Navigation
    if (dom.calPrevMonthBtn) {
      dom.calPrevMonthBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (dom.calNextMonthBtn) {
      dom.calNextMonthBtn.addEventListener('click', () => {
        state.currentCalendarDate.setMonth(state.currentCalendarDate.getMonth() + 1);
        renderCalendar();
      });
    }

    if (dom.calendarTodayBtn) {
      dom.calendarTodayBtn.addEventListener('click', () => {
        state.currentCalendarDate = new Date();
        state.selectedCalendarDateStr = formatDateKey(new Date());
        renderCalendar();
      });
    }

    // Study Timer Mode Tabs
    if (dom.modeStudy) dom.modeStudy.addEventListener('click', () => setTimerMode('study'));
    if (dom.modeShortBreak) dom.modeShortBreak.addEventListener('click', () => setTimerMode('shortBreak'));
    if (dom.modeLongBreak) dom.modeLongBreak.addEventListener('click', () => setTimerMode('longBreak'));

    // Timer Controls
    if (dom.timerStartBtn) dom.timerStartBtn.addEventListener('click', startTimer);
    if (dom.timerPauseBtn) dom.timerPauseBtn.addEventListener('click', pauseTimer);
    if (dom.timerResetBtn) dom.timerResetBtn.addEventListener('click', resetTimer);
    if (dom.celebrationDismissBtn) {
      dom.celebrationDismissBtn.addEventListener('click', () => {
        if (dom.timerCelebration) dom.timerCelebration.style.display = 'none';
      });
    }

    // Focus Timer Controls
    if (dom.focusStartBtn) dom.focusStartBtn.addEventListener('click', startTimer);
    if (dom.focusPauseBtn) dom.focusPauseBtn.addEventListener('click', pauseTimer);
    if (dom.focusResetBtn) dom.focusResetBtn.addEventListener('click', resetTimer);
    if (dom.focusTaskSelect) {
      dom.focusTaskSelect.addEventListener('change', (e) => {
        state.timerActiveTaskId = e.target.value || null;
        updateActiveTaskDisplay();
      });
    }

    // Timer Settings Toggle
    if (dom.toggleTimerSettingsHeader) {
      dom.toggleTimerSettingsHeader.addEventListener('click', () => {
        const isHidden = dom.timerSettingsBody.style.display === 'none';
        dom.timerSettingsBody.style.display = isHidden ? 'flex' : 'none';
        if (dom.timerSettingsToggleIcon) {
          dom.timerSettingsToggleIcon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        }
      });
    }

    // Preset Chips for Timer
    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const targetId = chip.dataset.target;
        const val = chip.dataset.val;
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.value = val;
          // highlight active chip
          chip.parentNode.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
    });

    if (dom.saveTimerSettingsBtn) dom.saveTimerSettingsBtn.addEventListener('click', saveTimerSettings);

    // Music Player Local File Input
    if (dom.addMusicFilesBtn && dom.musicFileInput) {
      dom.addMusicFilesBtn.addEventListener('click', () => {
        dom.musicFileInput.click();
      });

      dom.musicFileInput.addEventListener('change', (e) => {
        handleLocalMusicFiles(e.target.files);
        dom.musicFileInput.value = ''; // Reset input
      });
    }

    // Persistent Mini-Player Controls
    if (dom.playerPlayPauseBtn) {
      dom.playerPlayPauseBtn.addEventListener('click', () => {
        if (state.isPlayingMusic) {
          pauseAudio();
        } else {
          playAudio();
        }
      });
    }

    if (dom.focusMusicPlayBtn) {
      dom.focusMusicPlayBtn.addEventListener('click', () => {
        if (state.isPlayingMusic) {
          pauseAudio();
        } else {
          playAudio();
        }
      });
    }

    if (dom.playerNextBtn) dom.playerNextBtn.addEventListener('click', nextTrack);
    if (dom.playerPrevBtn) dom.playerPrevBtn.addEventListener('click', prevTrack);
    if (dom.focusMusicNextBtn) dom.focusMusicNextBtn.addEventListener('click', nextTrack);
    if (dom.focusMusicPrevBtn) dom.focusMusicPrevBtn.addEventListener('click', prevTrack);

    if (dom.playerLoopBtn) {
      dom.playerLoopBtn.addEventListener('click', () => {
        state.isLooping = !state.isLooping;
        dom.playerLoopBtn.style.color = state.isLooping ? 'var(--accent-gold)' : 'var(--text-secondary)';
        if (dom.globalAudioPlayer) dom.globalAudioPlayer.loop = state.isLooping;
        showToast(state.isLooping ? 'Repeat enabled' : 'Repeat disabled', 'info');
      });
    }

    // Audio Element Progress & Seek
    if (dom.globalAudioPlayer) {
      dom.globalAudioPlayer.addEventListener('timeupdate', () => {
        if (!dom.globalAudioPlayer.duration) return;
        const cur = dom.globalAudioPlayer.currentTime;
        const dur = dom.globalAudioPlayer.duration;

        const curMins = Math.floor(cur / 60);
        const curSecs = Math.floor(cur % 60);
        if (dom.playerCurrentTime) {
          dom.playerCurrentTime.textContent = `${String(curMins).padStart(2, '0')}:${String(curSecs).padStart(2, '0')}`;
        }

        const durMins = Math.floor(dur / 60);
        const durSecs = Math.floor(dur % 60);
        if (dom.playerDurationTime) {
          dom.playerDurationTime.textContent = `${String(durMins).padStart(2, '0')}:${String(durSecs).padStart(2, '0')}`;
        }

        if (dom.playerSeekSlider) {
          dom.playerSeekSlider.value = (cur / dur) * 100;
        }
      });

      dom.globalAudioPlayer.addEventListener('ended', () => {
        if (!state.isLooping) {
          nextTrack();
        }
      });
    }

    if (dom.playerSeekSlider) {
      dom.playerSeekSlider.addEventListener('input', (e) => {
        if (dom.globalAudioPlayer && dom.globalAudioPlayer.duration) {
          const seekTo = (e.target.value / 100) * dom.globalAudioPlayer.duration;
          dom.globalAudioPlayer.currentTime = seekTo;
        }
      });
    }

    // Volume Slider & Mute
    if (dom.playerVolumeSlider) {
      dom.playerVolumeSlider.addEventListener('input', (e) => {
        state.musicVolume = parseFloat(e.target.value);
        if (dom.globalAudioPlayer) dom.globalAudioPlayer.volume = state.musicVolume;
        if (state.ambientAudioNode && state.ambientAudioNode.gain) {
          state.ambientAudioNode.gain.gain.value = state.musicVolume * 0.15;
        }
        if (dom.playerMuteBtn) {
          dom.playerMuteBtn.textContent = state.musicVolume === 0 ? '🔇' : '🔊';
        }
      });
    }

    if (dom.playerMuteBtn) {
      dom.playerMuteBtn.addEventListener('click', () => {
        if (state.musicVolume > 0) {
          dom.playerVolumeSlider.value = 0;
          state.musicVolume = 0;
          if (dom.globalAudioPlayer) dom.globalAudioPlayer.volume = 0;
          dom.playerMuteBtn.textContent = '🔇';
        } else {
          dom.playerVolumeSlider.value = 0.75;
          state.musicVolume = 0.75;
          if (dom.globalAudioPlayer) dom.globalAudioPlayer.volume = 0.75;
          dom.playerMuteBtn.textContent = '🔊';
        }
      });
    }

    // Ambient Soundboard Buttons
    dom.ambientBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const ambientType = e.currentTarget.dataset.ambient;
        toggleAmbientSound(ambientType);
      });
    });

    if (dom.clearPlaylistBtn) {
      dom.clearPlaylistBtn.addEventListener('click', () => {
        stopAudio();
        state.playlist.forEach(t => {
          if (t.url && t.url.startsWith('blob:')) URL.revokeObjectURL(t.url);
        });
        state.playlist = [];
        state.currentTrackIndex = -1;
        updatePlayerUI(null);
        renderPlaylist();
        showToast('Playlist cleared.');
      });
    }

    // Profile Form
    if (dom.profileModalCloseBtn) dom.profileModalCloseBtn.addEventListener('click', closeProfileModal);
    if (dom.profileModalCancelBtn) dom.profileModalCancelBtn.addEventListener('click', closeProfileModal);
    if (dom.profileForm) dom.profileForm.addEventListener('submit', saveUserProfile);

    document.querySelectorAll('.avatar-option').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        if (dom.profileAvatarChoice) dom.profileAvatarChoice.value = e.currentTarget.dataset.avatar;
      });
    });

    // Supabase Settings Modal
    if (dom.supabaseModalCloseBtn) dom.supabaseModalCloseBtn.addEventListener('click', closeSupabaseSettingsModal);
    if (dom.supabaseConfigForm) {
      dom.supabaseConfigForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = dom.cfgSupabaseUrl.value.trim();
        const key = dom.cfgSupabaseKey.value.trim();

        if (!url || !key) {
          showToast('Please enter both Supabase URL and Anon Key.', 'warning');
          return;
        }

        if (window.studyflowConfig) {
          window.studyflowConfig.setSupabaseConfig(url, key);
        }

        showToast('Supabase credentials saved! Initializing client...', 'info');
        closeSupabaseSettingsModal();
        await initAuthSystem();
      });
    }

    if (dom.testSupabaseBtn) {
      dom.testSupabaseBtn.addEventListener('click', async () => {
        const url = dom.cfgSupabaseUrl.value.trim();
        const key = dom.cfgSupabaseKey.value.trim();
        dom.connectionTestResult.style.display = 'block';
        dom.connectionTestResult.className = 'connection-test-result';
        dom.connectionTestResult.textContent = 'Testing connection...';

        if (window.studyflowConfig) {
          const res = await window.studyflowConfig.testSupabaseConnection(url, key);
          dom.connectionTestResult.className = `connection-test-result ${res.success ? 'success' : 'error'}`;
          dom.connectionTestResult.textContent = res.message;
        }
      });
    }

    // --- Notification Center Event Listeners (Sections 50-52) ---
    if (dom.notificationBellBtn) {
      dom.notificationBellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dom.notificationPanel.style.display === 'block';
        dom.notificationPanel.style.display = isOpen ? 'none' : 'block';
      });
    }

    document.addEventListener('click', (e) => {
      if (dom.notificationPanel && !dom.notificationPanel.contains(e.target) && e.target !== dom.notificationBellBtn && !dom.notificationBellBtn?.contains(e.target)) {
        dom.notificationPanel.style.display = 'none';
      }
    });

    if (dom.markAllNotificationsReadBtn) {
      dom.markAllNotificationsReadBtn.addEventListener('click', () => {
        markAllNotificationsAsRead();
      });
    }

    if (dom.openNotifSettingsFromPanelBtn) {
      dom.openNotifSettingsFromPanelBtn.addEventListener('click', () => {
        if (dom.notificationPanel) dom.notificationPanel.style.display = 'none';
        openNotificationSettingsModal();
      });
    }

    // --- In-App Critical Deadline Banner (Section 53) ---
    if (dom.bannerDismissBtn) {
      dom.bannerDismissBtn.addEventListener('click', () => {
        if (state.activeBannerTaskId) {
          state.dismissedBannerTaskIds.add(state.activeBannerTaskId);
        }
        if (dom.deadlineReminderBanner) dom.deadlineReminderBanner.style.display = 'none';
      });
    }

    if (dom.bannerViewTaskBtn) {
      dom.bannerViewTaskBtn.addEventListener('click', () => {
        window.location.hash = '#tasks';
        if (state.activeBannerTaskId) {
          setTimeout(() => {
            const card = document.querySelector(`.task-card[data-id="${state.activeBannerTaskId}"]`);
            if (card) {
              card.scrollIntoView({ behavior: 'smooth', block: 'center' });
              card.classList.add('task-card-highlight');
              setTimeout(() => card.classList.remove('task-card-highlight'), 2500);
            }
          }, 100);
        }
      });
    }

    // --- Soft Browser Notification Permission Prompt (Section 44) ---
    if (dom.enableNotificationsBtn) {
      dom.enableNotificationsBtn.addEventListener('click', () => {
        requestBrowserNotificationPermission('prompt-card');
      });
    }

    if (dom.dismissPermissionPromptBtn) {
      dom.dismissPermissionPromptBtn.addEventListener('click', () => {
        localStorage.setItem('studyflow_notif_prompt_dismissed', 'true');
        if (dom.permissionPromptCard) dom.permissionPromptCard.style.display = 'none';
      });
    }

    // --- Notification & Reminder Settings Modal (Sections 58-60) ---
    if (dom.notifModalCloseBtn) dom.notifModalCloseBtn.addEventListener('click', closeNotificationSettingsModal);
    if (dom.notifModalCancelBtn) dom.notifModalCancelBtn.addEventListener('click', closeNotificationSettingsModal);
    if (dom.saveNotifSettingsBtn) dom.saveNotifSettingsBtn.addEventListener('click', saveNotificationSettings);

    if (dom.requestNotifPermissionModalBtn) {
      dom.requestNotifPermissionModalBtn.addEventListener('click', () => {
        requestBrowserNotificationPermission('modal');
      });
    }
  }

  // =========================================================================
  // 18. INITIALIZATION
  // =========================================================================
  function init() {
    cacheDomElements();
    setupEventListeners();

    // Check saved theme
    const savedTheme = localStorage.getItem('studyflow_theme') || 'dark';
    applyTheme(savedTheme);

    // Initial render of empty views & timer
    updateTimerConfigInputs();
    setTimerMode('study');
    renderTimerDisplay();

    // Initialize Service Worker for background notifications (Sections 61-62)
    initServiceWorker();

    // Update browser notification status UI
    updateBrowserNotificationStatusUI();

    // Populate timezone selector in settings
    populateTimezoneOptions();

    // Initialize Auth & Supabase data sync
    initAuthSystem();

    // Start automated deadline monitoring every 60 seconds (Section 47)
    if (state.deadlineCheckInterval) clearInterval(state.deadlineCheckInterval);
    state.deadlineCheckInterval = setInterval(() => {
      checkDeadlinesAndTriggerReminders();
    }, 60000);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
