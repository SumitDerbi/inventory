"""Engineer & installation jobs — engineers, skills, jobs, visits, checklists, reports."""
from django.db import models

from apps.core.models import AuditModel


class Engineer(AuditModel):
    user = models.OneToOneField(
        "auth_ext.User", on_delete=models.PROTECT, related_name="engineer_profile"
    )
    employee_code = models.CharField(max_length=50, blank=True, db_index=True)
    designation = models.CharField(max_length=100, blank=True)
    base_location = models.CharField(max_length=100, blank=True)
    mobile = models.CharField(max_length=20)
    is_available = models.BooleanField(default=True, db_index=True)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "engineers"
        ordering = ["user__email"]

    def __str__(self) -> str:
        return f"Engineer<{self.user_id}>"


class EngineerSkill(AuditModel):
    class Proficiency(models.TextChoices):
        BASIC = "basic", "Basic"
        INTERMEDIATE = "intermediate", "Intermediate"
        EXPERT = "expert", "Expert"

    engineer = models.ForeignKey(Engineer, on_delete=models.CASCADE, related_name="skills")
    skill_category = models.CharField(max_length=100, db_index=True)
    product_category = models.ForeignKey(
        "inventory.ProductCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="engineer_skills",
    )
    proficiency = models.CharField(max_length=20, choices=Proficiency.choices)
    certified = models.BooleanField(default=False)
    certification_name = models.CharField(max_length=255, blank=True)
    certified_until = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "engineer_skills"
        ordering = ["skill_category"]


class ChecklistTemplate(AuditModel):
    name = models.CharField(max_length=255)
    job_type = models.CharField(max_length=100, db_index=True)
    product_category = models.ForeignKey(
        "inventory.ProductCategory",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checklist_templates",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "checklist_templates"
        ordering = ["name"]


class ChecklistTemplateItem(AuditModel):
    class InputType(models.TextChoices):
        CHECKBOX = "checkbox", "Checkbox"
        TEXT = "text", "Text"
        NUMBER = "number", "Number"
        PHOTO = "photo", "Photo"
        SIGNATURE = "signature", "Signature"

    template = models.ForeignKey(
        ChecklistTemplate, on_delete=models.CASCADE, related_name="items"
    )
    step_number = models.PositiveIntegerField()
    step_title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_mandatory = models.BooleanField(default=True)
    input_type = models.CharField(max_length=20, choices=InputType.choices)
    expected_value = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "checklist_template_items"
        ordering = ["template", "step_number"]


class InstallationJob(AuditModel):
    class JobType(models.TextChoices):
        INSTALLATION = "installation", "Installation"
        COMMISSIONING = "commissioning", "Commissioning"
        AMC = "amc", "AMC"
        SERVICE_CALL = "service_call", "Service Call"
        INSPECTION = "inspection", "Inspection"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        ASSIGNED = "assigned", "Assigned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        ON_HOLD = "on_hold", "On Hold"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        URGENT = "urgent", "Urgent"
        HIGH = "high", "High"
        NORMAL = "normal", "Normal"
        LOW = "low", "Low"

    job_number = models.CharField(max_length=50, unique=True)
    order = models.ForeignKey(
        "orders.SalesOrder", on_delete=models.PROTECT, related_name="installation_jobs"
    )
    challan = models.ForeignKey(
        "dispatch.DispatchChallan",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="installation_jobs",
    )
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.PROTECT, related_name="installation_jobs"
    )
    site_address = models.TextField()
    site_contact_name = models.CharField(max_length=100, blank=True)
    site_contact_mobile = models.CharField(max_length=20, blank=True)
    job_type = models.CharField(max_length=20, choices=JobType.choices, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL, db_index=True)
    scheduled_date = models.DateField(null=True, blank=True, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    checklist_template = models.ForeignKey(
        ChecklistTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="installation_jobs",
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "installation_jobs"
        ordering = ["-scheduled_date", "-created_at"]


class JobAssignment(AuditModel):
    job = models.ForeignKey(InstallationJob, on_delete=models.CASCADE, related_name="assignments")
    engineer = models.ForeignKey(Engineer, on_delete=models.PROTECT, related_name="assignments")
    is_lead = models.BooleanField(default=False)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        "auth_ext.User", on_delete=models.PROTECT, related_name="assignments_made"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "job_assignments"
        ordering = ["-assigned_at"]


class VisitSchedule(AuditModel):
    class Status(models.TextChoices):
        PLANNED = "planned", "Planned"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        MISSED = "missed", "Missed"
        RESCHEDULED = "rescheduled", "Rescheduled"
        CANCELLED = "cancelled", "Cancelled"

    job = models.ForeignKey(InstallationJob, on_delete=models.CASCADE, related_name="visits")
    engineer = models.ForeignKey(Engineer, on_delete=models.PROTECT, related_name="visits")
    visit_number = models.PositiveIntegerField()
    scheduled_at = models.DateTimeField(db_index=True)
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNED, db_index=True)
    location_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = "visit_schedules"
        ordering = ["scheduled_at"]


class JobChecklistResponse(AuditModel):
    job = models.ForeignKey(
        InstallationJob, on_delete=models.CASCADE, related_name="checklist_responses"
    )
    visit = models.ForeignKey(
        VisitSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="checklist_responses",
    )
    template_item = models.ForeignKey(
        ChecklistTemplateItem,
        on_delete=models.PROTECT,
        related_name="responses",
    )
    response_value = models.TextField(blank=True)
    photo_path = models.CharField(max_length=500, blank=True)
    is_passed = models.BooleanField(null=True, blank=True)
    remarks = models.TextField(blank=True)
    responded_by = models.ForeignKey(Engineer, on_delete=models.PROTECT, related_name="checklist_responses")
    responded_at = models.DateTimeField()

    class Meta:
        db_table = "job_checklist_responses"
        ordering = ["job", "template_item__step_number"]


class ServiceReport(AuditModel):
    class ReportType(models.TextChoices):
        INSTALLATION = "installation", "Installation"
        COMMISSIONING = "commissioning", "Commissioning"
        SERVICE = "service", "Service"
        INSPECTION = "inspection", "Inspection"

    job = models.ForeignKey(
        InstallationJob, on_delete=models.CASCADE, related_name="service_reports"
    )
    visit = models.ForeignKey(
        VisitSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="service_reports",
    )
    report_type = models.CharField(max_length=20, choices=ReportType.choices, db_index=True)
    summary = models.TextField()
    issues_found = models.TextField(blank=True)
    actions_taken = models.TextField(blank=True)
    pending_actions = models.TextField(blank=True)
    customer_acknowledged = models.BooleanField(default=False)
    customer_signature_path = models.CharField(max_length=500, blank=True)
    submitted_by = models.ForeignKey(
        Engineer, on_delete=models.PROTECT, related_name="service_reports"
    )
    submitted_at = models.DateTimeField()
    pdf_path = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "service_reports"
        ordering = ["-submitted_at"]
