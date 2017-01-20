module MnoEnterprise
  class Impac::Dashboard < BaseResource

    attributes :full_name, :widgets_order, :settings, :organization_ids, :widgets_templates, :currency

    has_many :widgets, class_name: 'MnoEnterprise::Impac::Widget'
    has_many :kpis, class_name: 'MnoEnterprise::Impac::Kpi'
    belongs_to :owner, polymorphic: true

    #============================================
    # Instance methods
    #============================================
    # Return the full name of this dashboard
    # Currently a simple accessor to the dashboard name (used to include the company name)
    def full_name
      self.name
    end

    # Return all the organizations linked to this dashboard and to which
    # the user has access
    def organizations(org_list = nil)
      if org_list
        org_list.to_a.select { |e| self.organization_ids.include?(e.uid) }
      else
        MnoEnterprise::Organization.where('uid.in' => self.organization_ids).to_a
      end
    end

    # Filter widgets list based on config
    def filtered_widgets_templates
      # TODO: rework widgets templates discovery
      self.widgets_templates.push(
        { path: 'accounts/ratios/debt_service', name: 'Debt service ratio', desc: 'Operating income on Debt Service', icon: 'calculator', width: 6, metadata: { width: 6, name: 'Debt service ratio' } },
        { path: 'accounts/ratios/current', name: 'Current ratio', desc: 'Total Assets on Total Liabilities', icon: 'calculator', width: 6, metadata: { width: 6, name: 'Current ratio' } }
      )
    end

    def to_audit_event
      {name: name}
    end
  end
end
