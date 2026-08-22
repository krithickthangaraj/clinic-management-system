describe('Doctor Consultation Desk & Patient Queue E2E Tests (Cypress)', () => {
  const mockDashboardData = {
    kpis: {
      total_patients: 3,
      waiting: 3,
      followup: 1,
      reports_pending: 0,
      not_attended: 0,
      completed: 0,
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
        waiting_minutes: 25,
        remarks: 'Post-op review',
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
        waiting_minutes: 40,
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

  it('Scenario 1: Happy Path - Loads Consultation Desk and verifies compact calendar', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: mockDashboardData,
    }).as('getDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getDashboard');

    // Title & Calendar
    cy.get('.consultation-desk-title').should('contain', 'Consultation Desk');
    cy.get('.calendar-compact-icon').should('be.visible');

    // Waiting Time Badges
    cy.get('[data-testid="queue-row-201"] .waiting-time-badge').should('have.class', 'waiting-badge-normal').and('contain', '8 min');
    cy.get('[data-testid="queue-row-202"] .waiting-time-badge').should('have.class', 'waiting-badge-warning').and('contain', '25 min');
    cy.get('[data-testid="queue-row-203"] .waiting-time-badge').should('have.class', 'waiting-badge-critical').and('contain', '40 min');
  });

  it('Scenario 2: Segmented Category Control filtering', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: mockDashboardData,
    }).as('getDashboard');

    cy.visit('/doctor/queue');
    cy.wait('@getDashboard');

    // Click "Emergency"
    cy.get('[data-testid="category-tab-emergency"]').click();
    cy.get('[data-testid="patient-queue-table"] tbody tr.patient-data-row').should('have.length', 1);
    cy.get('[data-testid="queue-row-203"]').should('contain', 'Deepak Selvam');

    // Click "Follow-up"
    cy.get('[data-testid="category-tab-follow-up"]').click();
    cy.get('[data-testid="patient-queue-table"] tbody tr.patient-data-row').should('have.length', 1);
    cy.get('[data-testid="queue-row-202"]').should('contain', 'Sundaram Pillai');
  });

  it('Scenario 3: Automated status transition on row click', () => {
    cy.intercept('GET', '**/api/v1/doctor/dashboard*', {
      statusCode: 200,
      body: mockDashboardData,
    }).as('getDashboard');

    cy.intercept('PATCH', '**/api/v1/visits/201', {
      statusCode: 200,
      body: { id: 201, status: 'in_consultation' },
    }).as('updateVisitStatus');

    cy.visit('/doctor/queue');
    cy.wait('@getDashboard');

    cy.get('[data-testid="queue-row-201"]').click();
    cy.wait('@updateVisitStatus').its('request.body').should('deep.include', { status: 'in_consultation' });
    cy.url().should('include', '/doctor/consultation/201');
  });
});
