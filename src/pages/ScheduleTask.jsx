import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useMqtt } from '../store/MqttContext';

const ScheduleTask = () => {
  const [formData, setFormData] = useState({
    schedule_id: '',
    date: '',       // YYYY-MM-DD
    time: '',       // HH:MM
    cyclecount: '',
    recurring_hours: '',
  });

  const [dropdownValue, setDropdownValue] = useState('');
  const [ids, setIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tableData, setTableData] = useState([]);

  const { publishMessage } = useMqtt();
  const ApiUrl = import.meta.env.VITE_API_URL;


  // Fetch schedule IDs
  const fetchScheduleIds = async () => {
    try {
      const response = await axios.get(`${ApiUrl}/get_all_schedule_ids/`);
      setIds(response.data.schedule_ids || []);
    } catch (error) {
      console.error('Fetch schedule IDs error:', error);
    }
  };

  // Fetch all schedules (for table)
  const fetchSchedules = async () => {
    try {
      const response = await axios.get(`${ApiUrl}/get_all_schedules/`);
      setTableData(response.data.schedules || []);
    } catch (error) {
      console.error('Fetch schedules error:', error);
      setTableData([]);
    }
  };

  useEffect(() => {
    fetchScheduleIds();
    fetchSchedules();
  }, []);

  // Refresh IDs and schedules when tableData changes — but to avoid infinite loops, call manually below

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e) => {
    setDropdownValue(e.target.value);
  };

  const handleRemove = async () => {
    try {
      if (dropdownValue) {
        const response = await axios.post(`${ApiUrl}/delete_schedule_id/`, {
          schedule_id: dropdownValue,
        });
        if (response.status === 200) {
          console.log('Item removed successfully');
          publishMessage('feeder/fdtryA00/schedule_cancel', `${dropdownValue}`);

          // Refresh IDs and schedules
          await fetchScheduleIds();
          await fetchSchedules();
        }
        setDropdownValue(''); // Reset dropdown after removal
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    const start_time = `${formData.date} ${formData.time}`;

    try {
      const response = await axios.post(`${ApiUrl}/create_schedule/`, {
        ...formData,
        start_time,
      });

      if (response.status !== 200) {
        throw new Error('Failed to save schedule');
      }

      publishMessage(
        'feeder/fdtryA00/schedule_set',
        `${formData.schedule_id}|${start_time}|${formData.cyclecount}|${formData.recurring_hours}`
      );

      setSuccess(true);
      setFormData({ schedule_id: '', date: '', time: '', cyclecount: '', recurring_hours: '' });

      // Refresh IDs and schedules after successful submission
      await fetchScheduleIds();
      await fetchSchedules();
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* LEFT SIDE: Create Schedule Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Schedule</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              Schedule saved!
            </div>
          )}

          {/* Schedule ID */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Schedule ID
            </label>
            <input
              type="text"
              name="schedule_id"
              value={formData.schedule_id}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Cycle Count */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">Cycle Count</label>
            <input
              type="number"
              name="cyclecount"
              value={formData.cyclecount}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Recurring Hours */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Recurring Hours
            </label>
            <input
              type="number"
              name="recurring_hours"
              value={formData.recurring_hours}
              onChange={handleChange}
              min="0"
              max="24"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {isLoading ? 'Saving...' : 'Submit Schedule'}
          </button>
        </form>

        {/* RIGHT SIDE: Dropdown + Table */}
        <div className="flex flex-col gap-6">
          {/* Dropdown Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Remove Schedule
            </h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Select Schedule ID
                </label>
                <select
                  value={dropdownValue}
                  onChange={handleDropdownChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose an option</option>
                  {ids.map((item, index) => (
                    <option key={index} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="bg-red-500 text-white px-4 py-2 h-[42px] rounded-md hover:bg-red-600 transition"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white p-6 rounded-lg shadow-md overflow-x-auto overflow-y-auto max-h-96">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Schedules
            </h2>
            <table className="min-w-full table-auto border divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    'ID',
                    'Schedule ID',
                    'Start Time',
                    'Cycle Count',
                    'Recurring Hours',
                  ].map((head) => (
                    <th
                      key={head}
                      className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tableData) &&
                  tableData.map((schedule, index) => (
                    <tr
                      key={schedule.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-2">{schedule.id}</td>
                      <td className="px-4 py-2 font-medium">{schedule.schedule_id}</td>
                      <td className="px-4 py-2">
                        {new Date(schedule.start_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">{schedule.cyclecount}</td>
                      <td className="px-4 py-2">{schedule.recurring_hours}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleTask;
