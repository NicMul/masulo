/***
*
*   GROUP SELECT
*   Reusable group selection dropdown component that fetches groups from API
*
*   PROPS
*   className: custom styling (string, optional)
*   error: error state (boolean, optional)
*   register: react-hook-form register function (function, optional)
*   required: validation rules (object, optional)
*   value: controlled value (string, optional)
*   onChange: change handler (function, optional)
*   name: input name (string, optional)
*   placeholder: placeholder text (string, optional)
*
**********/

import { forwardRef, useState, useEffect } from 'react';
import { cn, useAPI } from 'components/lib';

export const GroupSelect = forwardRef(({ 
  className, 
  error, 
  placeholder = "Select a group",
  ...props 
}, ref) => {
  
  // Fetch groups from API
  const groupsRes = useAPI('/api/group');
  const [groups, setGroups] = useState([]);

  // Update groups when data loads
  useEffect(() => {
    if (groupsRes.data) {
      setGroups(groupsRes.data);
    }
  }, [groupsRes.data]);

  return (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-300" : "border-gray-300",
        className
      )}
      {...props}
    >
      <option value="">{placeholder}</option>
      {groups.length > 0 ? (
        groups.map(group => (
          <option key={group.id} value={group.friendlyName}>
            {group.friendlyName}
          </option>
        ))
      ) : (
        <option value="" disabled>
          No Groups Configured
        </option>
      )}
    </select>
  );
});

GroupSelect.displayName = 'GroupSelect';
