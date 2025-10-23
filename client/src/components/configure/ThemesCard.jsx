/***
*
*   THEMES CARD
*   Themes management card with table and form actions
*
**********/

import { useContext, useCallback } from 'react';
import { ViewContext, Table, Button } from 'components/lib';

export function ThemesCard({ themes, setThemes, onUpdate, t }){

  // context
  const viewContext = useContext(ViewContext);

  // create new theme
  const createTheme = useCallback(() => {
    viewContext.dialog.open({
      title: t('configure.themes.create.title'),
      form: {
        inputs: {
          cmsThemeId: {
            label: t('configure.themes.form.cmsThemeId.label'),
            type: 'text',
            required: true,
            errorMessage: t('configure.themes.form.cmsThemeId.error')
          },
          friendlyName: {
            label: t('configure.themes.form.friendlyName.label'),
            type: 'text',
            required: true,
            errorMessage: t('configure.themes.form.friendlyName.error')
          },
          description: {
            label: t('configure.themes.form.description.label'),
            type: 'textarea',
            required: true,
            errorMessage: t('configure.themes.form.description.error')
          }
        },
        buttonText: t('configure.themes.create.button'),
        url: '/api/theme',
        method: 'POST'
      }
    }, (data, res) => {
      // trigger refresh to get fresh data from API
      if (res && res.data) {
        onUpdate();
      }
    });
  }, [t, viewContext, onUpdate]);

  // edit theme
  const editTheme = useCallback(({ row, editRowCallback }) => {
    viewContext.dialog.open({
      title: t('configure.themes.edit.title'),
      form: {
        inputs: {
          cmsThemeId: {
            label: t('configure.themes.form.cmsThemeId.label'),
            type: 'text',
            required: true,
            value: row.cmsThemeId,
            errorMessage: t('configure.themes.form.cmsThemeId.error')
          },
          friendlyName: {
            label: t('configure.themes.form.friendlyName.label'),
            type: 'text',
            required: true,
            value: row.friendlyName,
            errorMessage: t('configure.themes.form.friendlyName.error')
          },
          description: {
            label: t('configure.themes.form.description.label'),
            type: 'textarea',
            required: true,
            value: row.description,
            errorMessage: t('configure.themes.form.description.error')
          }
        },
        buttonText: t('configure.themes.edit.button'),
        url: `/api/theme/${row.id}`,
        method: 'PATCH'
      }
    }, (data, res) => {
      // trigger refresh to get fresh data from API
      if (res && res.data) {
        onUpdate();
      }
    });
  }, [t, viewContext, onUpdate]);

  // delete theme
  const deleteTheme = useCallback(({ row, deleteRowCallback }) => {
    viewContext.dialog.open({
      title: t('configure.themes.delete.title'),
      description: `${t('configure.themes.delete.description')} "${row.friendlyName}"?`,
      form: {
        inputs: false,
        buttonText: t('configure.themes.delete.button'),
        url: `/api/theme/${row.id}`,
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
      label: t('configure.themes.create.action'),
      icon: 'plus',
      globalOnly: true,
      action: createTheme
    },
    {
      label: t('configure.themes.edit.action'),
      icon: 'edit',
      globalOnly: false,
      action: editTheme
    },
    {
      label: t('configure.themes.delete.action'),
      icon: 'trash-2',
      globalOnly: false,
      action: deleteTheme
    }
  ];

  return (
    <div>
      <div className='flex justify-end gap-2 mb-4'>
        <Button icon='plus' text={t('configure.themes.create.action')} onClick={createTheme} />
      </div>
      <Table
        searchable
        data={themes}
        loading={false}
        actions={actions}
        show={['cmsThemeId', 'friendlyName', 'description']}
      />
    </div>
  );
}