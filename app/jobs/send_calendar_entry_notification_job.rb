class SendCalendarEntryNotificationJob < ApplicationJob
  queue_as :default

  def perform(calendar_entry_id, user_ids, type)
    entry = CalendarEntry.find_by(id: calendar_entry_id)
    return true if entry.nil? || user_ids&.none?

    entry.create_messages(user_ids, type)
    entry.send_emails(user_ids, type)
  end
end
