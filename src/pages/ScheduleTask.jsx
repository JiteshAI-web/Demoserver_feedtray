import React, { useEffect, useState } from 'react';
import { useMqtt } from '../store/MqttContext';
import { initialSchedulesData, initialScheduleIds } from '../utils/mockData';

const ScheduleTask = ({ latestTrayStatus }) => {
  const initialFormState = {
    schedule_id: '',
    date: '',
    time: '',
    cyclecount: '',
    recurring_hours: 0,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [dropdownValue, setDropdownValue] = useState('');
  const [ids, setIds] = useState(initialScheduleIds);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tableData, setTableData] = useState(initialSchedulesData);

  const { publishMessage } = useMqtt();

  const getStartTimeMs = (startTimeStr) => {
    if (!startTimeStr) return 0;
    const isoStr = startTimeStr.includes('T') ? startTimeStr : startTimeStr.replace(' ', 'T');
    return new Date(isoStr).getTime() || new Date(startTimeStr).getTime() || 0;
  };

  // Dynamic time-based schedule status tracker (Pending -> Running -> Completed / Aborted)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setTableData((prevTable) => {
        let changed = false;

        const nextTable = prevTable.map((schedule) => {
          if (schedule.status === 'Removed' || schedule.status === 'Aborted') {
            return schedule;
          }

          // Check for Abort action
          if (latestTrayStatus === 'Aborted' && (schedule.status === 'Running' || schedule.status === 'Pending')) {
            changed = true;
            return { ...schedule, status: 'Aborted' };
          }

          const startTimeMs = getStartTimeMs(schedule.start_time);

          // Transition Pending -> Running when schedule time is reached
          if (schedule.status === 'Pending' && now >= startTimeMs) {
            changed = true;
            publishMessage('feeder/fdtryA00/cycle_status', `Running Cycle ID: ${schedule.schedule_id}`);
            publishMessage('feeder/fdtryA00/schedule_status', `Scheduler: RUNNING - Schedule ${schedule.schedule_id}`);
            return {
              ...schedule,
              status: 'Running',
              startedAt: now,
            };
          }

          // Transition Running -> Completed after cycle duration (e.g. 10 seconds)
          if (schedule.status === 'Running') {
            const runningMs = now - (schedule.startedAt || startTimeMs);
            if (runningMs >= 10000) {
              changed = true;
              publishMessage('feeder/fdtryA00/cycle_status', 'All Cycles Completed Successfully');
              publishMessage('feeder/fdtryA00/schedule_status', 'Scheduler: IDLE - No scheduled cycles');
              return { ...schedule, status: 'Completed' };
            }
          }

          return schedule;
        });

        return changed ? nextTable : prevTable;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [latestTrayStatus, publishMessage]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (e) => {
    setDropdownValue(e.target.value);
  };

  const handleRemove = () => {
    if (dropdownValue) {
      setIds((prev) => prev.filter((id) => id !== dropdownValue));
      setTableData((prev) =>
        prev.map((item) =>
          item.schedule_id === dropdownValue ? { ...item, status: 'Removed' } : item
        )
      );
      publishMessage('feeder/fdtryA00/schedule_cancel', `${dropdownValue}`);
      setDropdownValue('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    // Prevent duplicate IDs
    if (ids.includes(formData.schedule_id)) {
      setError('Schedule ID already exists');
      setIsLoading(false);
      return;
    }

    const start_time = `${formData.date} ${formData.time}`;
    const nextId = tableData.length > 0 ? Math.max(...tableData.map((d) => d.id)) + 1 : 1;

    const startTimeMs = getStartTimeMs(start_time);
    const isTimeNow = Date.now() >= startTimeMs;

    const newSchedule = {
      id: nextId,
      schedule_id: formData.schedule_id,
      start_time: start_time,
      cyclecount: Number(formData.cyclecount) || 1,
      status: isTimeNow ? 'Running' : 'Pending',
      startedAt: isTimeNow ? Date.now() : null,
    };

    setTableData((prev) => [newSchedule, ...prev]);
    if (!ids.includes(formData.schedule_id)) {
      setIds((prev) => [...prev, formData.schedule_id]);
    }

    if (isTimeNow) {
      publishMessage('feeder/fdtryA00/cycle_status', `Running Cycle ID: ${formData.schedule_id}`);
      publishMessage('feeder/fdtryA00/schedule_status', `Scheduler: RUNNING - Schedule ${formData.schedule_id}`);
    } else {
      publishMessage(
        'feeder/fdtryA00/schedule_set',
        `${formData.schedule_id}|${start_time}|${formData.cyclecount}|${formData.recurring_hours}`
      );
    }

    setSuccess(true);
    setFormData(initialFormState);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

        {/* LEFT SIDE: Create Schedule Form */}
        <form onSubmit={handleSubmit} className="md:col-span-1 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Schedule</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
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
                min={new Date().toISOString().split("T")[0]}
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
                min={
                  formData.date === new Date().toISOString().split("T")[0]
                    ? new Date().toTimeString().slice(0, 5)
                    : "00:00"
                }
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

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {isLoading ? 'Saving...' : 'Submit Schedule'}
          </button>
        </form>

        {/* RIGHT SIDE: Dropdown + Table */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* Dropdown Section */}
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Remove Schedule
            </h2>
            <div className="flex gap-2 items-end">
              <div className="w-48">
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
                  {['Sl.no.', 'Schedule ID', 'Start Time', 'Cycle Count', 'Status'].map((head) => (
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
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            schedule.status === 'Running'
                              ? 'bg-blue-100 text-blue-800 animate-pulse'
                              : schedule.status === 'Completed'
                              ? 'bg-green-100 text-green-800'
                              : schedule.status === 'Aborted'
                              ? 'bg-red-100 text-red-800'
                              : schedule.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </td>
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
