class Profile::StudentActivitySessionSerializer < ActiveModel::Serializer
  include Rails.application.routes.url_helpers

  attributes :id, :percentage, :link, :due_date_or_completed_at_date, :due_date, :state
  has_one :activity, serializer: Profile::StudentActivitySerializer

  def link
    play_activity_session_path(object)
  end

  def due_date_or_completed_at_date
    object.display_due_date_or_completed_at_date
  end

  def due_date
    object.classroom_activity.formatted_due_date
  end

end
