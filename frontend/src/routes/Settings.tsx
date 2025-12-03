import { ServiceIntervalSettingsForm } from '../components/settings/ServiceIntervalSettingsForm';
import { EmailSettingsForm } from '../components/settings/EmailSettingsForm';

export function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="space-y-6">
        <ServiceIntervalSettingsForm />
        <EmailSettingsForm />
      </div>
    </div>
  );
}
