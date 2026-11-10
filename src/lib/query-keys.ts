export const queryKeys = {
  clinics: () => ["clinics"] as const,
  currentClinic: () => ["current-clinic"] as const,
  adminMembers: () => ["admin-members"] as const,
  members: () => ["members"] as const,
  member: (memberId: string) => ["member", memberId] as const,
  staffProgram: () => ["staff-program"] as const,
  staffCatalog: () => ["staff-catalog"] as const,
  memberRewards: (memberId: string) => ["member-rewards", memberId] as const,
  templatePresets: () => ["template-presets"] as const,
  clinicTemplate: (clinicId: string) => ["clinic-template", clinicId] as const,
  template: (templateId: string) => ["template", templateId] as const,
  treatments: () => ["treatments"] as const,
  bonoPlans: () => ["bono-plans"] as const,
  memberBonos: (memberId: string) => ["member-bonos", memberId] as const,
  treatmentCatalogue: () => ["treatment-catalogue"] as const,
  treatmentCategories: () => ["treatment-categories"] as const,
  changeRequests: {
    all: () => ["change-requests"] as const,
    list: (status: string | null) =>
      ["change-requests", "list", status] as const,
    detail: (id: string) => ["change-requests", "detail", id] as const,
    openCount: () => ["change-requests", "open-count"] as const,
  },
  templates: () => ["templates"] as const,
  templateRefreshStatus: () => ["template-refresh-status"] as const,
  vooneTemplates: () => ["voone-templates"] as const,
  onboarding: {
    bonos: (clinicId: string) => ["onboarding", clinicId, "bonos"] as const,
    catalog: (clinicId: string) => ["onboarding", clinicId, "catalog"] as const,
    estimates: (clinicId: string) =>
      ["onboarding", clinicId, "estimates"] as const,
    preview: (clinicId: string, answers: unknown) =>
      ["onboarding", clinicId, "preview", answers] as const,
    programs: (clinicId: string) =>
      ["onboarding", clinicId, "programs"] as const,
    program: (clinicId: string, programId: string) =>
      ["onboarding", clinicId, "program", programId] as const,
    recalibration: (clinicId: string) =>
      ["onboarding", clinicId, "recalibration"] as const,
    prizeStatus: (clinicId: string) =>
      ["onboarding", clinicId, "prize-status"] as const,
    calculator: (clinicId: string, programId: string, input: unknown) =>
      ["onboarding", clinicId, "calculator", programId, input] as const,
    /** Every calculator answer of one programme, whatever clients and ticket were asked. */
    calculators: (clinicId: string, programId: string) =>
      ["onboarding", clinicId, "calculator", programId] as const,
    comparison: (clinicId: string, programId: string, revision: number) =>
      ["onboarding", clinicId, "comparison", programId, revision] as const,
  },
  mutations: {
    addMember: () => ["add-member"] as const,
    creditMember: () => ["credit-member"] as const,
    updateMember: () => ["update-member"] as const,
    createPasswordSetupLink: () => ["create-password-setup-link"] as const,
    provisionClinic: () => ["provision-clinic"] as const,
    saveAdminTemplate: () => ["save-admin-template"] as const,
    saveAdminVooneTemplate: () => ["save-admin-voone-template"] as const,
    saveTemplate: () => ["save-template"] as const,
    sendMemberPassEmail: () => ["send-member-pass-email"] as const,
    signUpMember: () => ["sign-up-member"] as const,
  },
} as const;
