module V1
  module Employee
    class BaseService
      include Singleton

      def create(params)
        ActiveRecord::Base.transaction do
          employee = ::Employee.create!(
            name: params[:name],
            registration: params[:registration],
            birthday: params[:birthday],
            municipality: params[:municipality],
            state: params[:state],
            gender_id: params[:gender_id],
            marital_state_id: params[:marital_state_id]
          )

          employee_complement = ::EmployeeComplement.create!(
            employee_id: employee.id, 
            workspace_id: params[:workspace_id],
            job_role_id: params[:job_role_id]
          )

          params[:contacts].each do |contact|
            ::EmployeeContact.create!(
              employee_id: employee.id,
              phone: contact[:phone],
              cell_phone: contact[:cell_phone],
              email: contact[:email]
            )
          end

          if params[:document_upload].present?
            employee.employee_documents.create!(document: params[:document_upload])
          end

          unless employee_complement.persisted?
            raise ActiveRecord::Rollback, 'Failed create EmployeeComplement'
          end

          employee
        end
      end

      def update(params)
        employee = ::Employee.find(params[:id])
        
        ActiveRecord::Base.transaction do
          employee.update!(
            name: params[:name],
            registration: params[:registration],
            birthday: params[:birthday],
            municipality: params[:municipality],
            state: params[:state],
            gender_id: params[:gender_id],
            marital_state_id: params[:marital_state_id]
          )

          employee.employee_complement.update!(
            workspace_id: params[:workspace_id],
            job_role_id: params[:job_role_id]
          )

          existing_contacts = employee.employee_contacts.index_by(&:id)
          params[:contacts].values.each do |contact_params|
            if contact_params[:id].present?
              if existing_contacts[contact_params[:id].to_i]
                existing_contacts[contact_params[:id].to_i].update!(
                  phone: contact_params[:phone],
                  cell_phone: contact_params[:cell_phone],
                  email: contact_params[:email]
                )
                existing_contacts.delete(contact_params[:id].to_i)
              end
            else
              employee.employee_contacts.create!(
                phone: contact_params[:phone],
                cell_phone: contact_params[:cell_phone],
                email: contact_params[:email]
              )
            end
          end

          existing_contacts.values.each(&:destroy)

          if params[:document_upload].present?
            employee.employee_documents.create!(document: params[:document_upload])
          end
        end

        employee
      end

      def delete(params)
        employee = ::Employee.find(params[:id])

        if employee.employee_complement
          ActiveRecord::Base.transaction do
            employee.employee_complement.destroy
            employee.destroy!
          end
          { success: true, message: 'Funcionário e dados complementares excluídos com sucesso' }
        else
          employee.destroy
          { success: true, message: 'Funcionário excluído com sucesso' }
        end
      rescue StandardError => e
        { success: false, error: e.message }
      end
    end
  end
end
  