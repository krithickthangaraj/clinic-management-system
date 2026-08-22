describe('Doctor Dashboard & Patient Queue E2E Tests (Cypress)', () => {
  const mockDashboardData = {
    kpis: {
      total_patients: 8,
      waiting: 3,
      followup: 2,
      reports_pending: 1,
      not_attended: 0,
      completed: 2,
    },
    queue: [
      {
        queue_no: 1,
        visit_id: 201,
        visit_number: 'V-20260822-101',
        patient_id: 'PAT-00021',
        numeric_patient_id: 21,
        patient_name: 'Kavitha Ramachandran',
        age_sex: '36 Yrs / F',
        category: 'OPD',
        waiting_time: '8 min',
        waiting_minutes: 8,
        remarks: 'Migraine headache',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 8 * 60000).toISOString(),
      },
      {
        queue_no: 2,
        visit_id: 202,
        visit_number: 'V-20260822-102',
        patient_id: 'PAT-00022',
        numeric_patient_id: 22,
        patient_name: 'Sundaram Pillai',
        age_sex: '62 Yrs / M',
        category: 'Follow-up',
        waiting_time: '25 min',
        waiting_minutes: 25, // Warning threshold (>15m)
        remarks: 'Post-op diabetic review',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        queue_no: 3,
        visit_id: 203,
        visit_number: 'V-20260822-103',
        patient_id: 'PAT-00023',
        numeric_patient_id: 23,
        patient_name: 'Deepak Selvam',
        age_sex: '41 Yrs / M',
        category: 'Emergency',
        waiting_time: '40 min',
        waiting_minutes: 40, // Urgent threshold (>30m)
        remarks: 'Acute abdominal pain',
        status: 'vitals_done',
        created_at: new Date(Date.now() - 40 * 60000).toISOString(),
      },
    ],
    date: '22 Aug 2026',
  };

  beforeEach(() => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        username: 'doctor1',
        full_name: 'Dr. T.S.Jeyagowthaman',
        role: 'doctor',
      })
    );
  });

  it('Scenario 1: Happy Path - Loads KPIs and navigates on row click', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: mockDashboardData,
    }).as('getDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getDashboard');

    // KPI assertions
    cy.get('[data-testid="kpi-total_patients"]').should('contain', '8');
    cy.get('[data-testid="kpi-waiting"]').should('contain', '3');
    cy.get('[data-testid="kpi-followup"]').should('contain', '2');

    // Table row assertion & click
    cy.get('[data-testid="queue-row-201"]').should('be.visible').and('contain', 'Kavitha Ramachandran');
    cy.get('[data-testid="queue-row-201"]').click();
    cy.url().should('include', '/doctor/consultation/201');
  });

  it('Scenario 2: Empty State - Displays clean zero-state message', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: {
        kpis: {
          total_patients: 0,
          waiting: 0,
          followup: 0,
          reports_pending: 0,
          not_attended: 0,
          completed: 0,
        },
        queue: [],
        date: '22 Aug 2026',
      },
    }).as('getEmptyDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getEmptyDashboard');

    cy.get('[data-testid="empty-queue-row"]').should('be.visible');
    cy.get('.empty-queue-heading').should('contain', 'No Patients in Queue');
  });

  it('Scenario 3: Dynamic Waiting Time classes (>15m Amber, >30m Red)', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: mockDashboardData,
    }).as('getDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getDashboard');

    // 8 min -> Normal
    cy.get('[data-testid="queue-row-201"] [data-testid="waiting-time-cell"]').should('have.class', 'waiting-time-normal');
    // 25 min -> Amber warning
    cy.get('[data-testid="queue-row-202"] [data-testid="waiting-time-cell"]').should('have.class', 'waiting-time-warning');
    // 40 min -> Red urgent
    cy.get('[data-testid="queue-row-203"] [data-testid="waiting-time-cell"]').should('have.class', 'waiting-time-urgent');
  });

  it('Scenario 4: Error Handling - Handles 500 error gracefully', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 500,
      body: { detail: 'Internal Server Error' },
    }).as('getFailedDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getFailedDashboard');

    cy.get('[data-testid="dashboard-error-banner"]').should('be.visible').and('contain', 'Unable to connect to clinic server');
  });
});
