/***
*
*   GROUPS CARD
*   Groups management card with table and form actions
*
**********/

import { useContext, useCallback } from 'react';
import { ViewContext, Table, Button } from 'components/lib';

export function GroupsCard({ groups, setGroups, onUpdate, t }){

  // context
  const viewContext = useContext(ViewContext);

  // create new group
  const createGroup = useCallback(() => {
    viewContext.dialog.open({
      title: t('configure.groups.create.title'),
      form: {
        inputs: {
          cmsGroupId: {
            label: t('configure.groups.form.cmsGroupId.label'),
            type: 'text',
            required: true,
            errorMessage: t('configure.groups.form.cmsGroupId.error')
          },
          friendlyName: {
            label: t('configure.groups.form.friendlyName.label'),
            type: 'text',
            required: true,
            errorMessage: t('configure.groups.form.friendlyName.error')
          },
          description: {
            label: t('configure.groups.form.description.label'),
            type: 'textarea',
            required: true,
            errorMessage: t('configure.groups.form.description.error')
          }
        },
        buttonText: t('configure.groups.create.button'),
        url: '/api/group',
        method: 'POST'
      }
    }, (data, res) => {
      // trigger refresh to get fresh data from API
      if (res && res.data) {
        onUpdate();
      }
    });
  }, [t, viewContext, onUpdate]);

  // edit group
  const editGroup = useCallback(({ row, editRowCallback }) => {
    viewContext.dialog.open({
      title: t('configure.groups.edit.title'),
      form: {
        inputs: {
          cmsGroupId: {
            label: t('configure.groups.form.cmsGroupId.label'),
            type: 'text',
            required: true,
            value: row.cmsGroupId,
            errorMessage: t('configure.groups.form.cmsGroupId.error')
          },
          friendlyName: {
            label: t('configure.groups.form.friendlyName.label'),
            type: 'text',
            required: true,
            value: row.friendlyName,
            errorMessage: t('configure.groups.form.friendlyName.error')
          },
          description: {
            label: t('configure.groups.form.description.label'),
            type: 'textarea',
            required: true,
            value: row.description,
            errorMessage: t('configure.groups.form.description.error')
          }
        },
        buttonText: t('configure.groups.edit.button'),
        url: `/api/group/${row.id}`,
        method: 'PATCH'
      }
    }, (data, res) => {
      // trigger refresh to get fresh data from API
      if (res && res.data) {
        onUpdate();
      }
    });
  }, [t, viewContext, onUpdate]);

  // delete group
  const deleteGroup = useCallback(({ row, deleteRowCallback }) => {
    viewContext.dialog.open({
      title: t('configure.groups.delete.title'),
      description: `${t('configure.groups.delete.description')} "${row.friendlyName}"?`,
      form: {
        inputs: false,
        buttonText: t('configure.groups.delete.button'),
        url: `/api/group/${row.id}`,
        method: 'DELETE',
        destructive: true
      }
    }, (data, res) => {
      // trigger refresh to get fresh data from API
      if (res) {
        onUpdate();
      }
    });
  }, [t, viewContext, onUpdate]);

  const actions = [
    {
      label: t('configure.groups.create.action'),
      icon: 'plus',
      global: true,
      color: 'green',
      action: createGroup
    },
    {
      label: t('configure.groups.edit.action'),
      icon: 'pencil',
      globalOnly: false,
      action: editGroup
    },
    {
      label: t('configure.groups.delete.action'),
      icon: 'trash-2',
      globalOnly: false,
      action: deleteGroup
    }
  ];

  return (
    <div>
      <div className='flex justify-end gap-2 mb-4'>
        <Button icon='plus' text={t('configure.groups.create.action')} onClick={createGroup} />
      </div>
      
      <Table
        searchable
        data={groups}
        loading={false}
        actions={actions}
        show={['cmsGroupId', 'friendlyName', 'description']}
      />
    </div>
  );
}
