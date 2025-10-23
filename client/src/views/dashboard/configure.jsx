/***
*
*   CONFIGURE VIEW
*   Configuration view with Groups and Themes management
*
**********/

import { useContext, useState, useEffect } from 'react';
import { ViewContext, Card, Grid, Animate, useAPI } from 'components/lib';
import { GroupsCard } from 'components/configure/GroupsCard';
import { ThemesCard } from 'components/configure/ThemesCard';

export function Configure({ t }){

  // context
  const viewContext = useContext(ViewContext);

  // state
  const [groups, setGroups] = useState([]);
  const [themes, setThemes] = useState([]);
  const [groupsRefreshTrigger, setGroupsRefreshTrigger] = useState(0);
  const [themesRefreshTrigger, setThemesRefreshTrigger] = useState(0);

  // fetch groups data with refresh trigger
  const groupsRes = useAPI('/api/group', 'get', groupsRefreshTrigger);

  // fetch themes data with refresh trigger
  const themesRes = useAPI('/api/theme', 'get', themesRefreshTrigger);

  // update state when data loads
  useEffect(() => {
    if (groupsRes.data) {
      setGroups(groupsRes.data);
    }
  }, [groupsRes.data]);

  useEffect(() => {
    if (themesRes.data) {
      setThemes(themesRes.data);
    }
  }, [themesRes.data]);

  // function to trigger refresh
  const handleGroupsUpdate = () => {
    setGroupsRefreshTrigger(prev => prev + 1);
  };

  const handleThemesUpdate = () => {
    setThemesRefreshTrigger(prev => prev + 1);
  };

  return (
    <Animate type='pop'>
      <Grid max={2} className="gap-6">
        
        {/* Groups Card */}
        <Card title={t('configure.groups.title')}>
          <GroupsCard 
            groups={groups}
            setGroups={setGroups}
            onUpdate={handleGroupsUpdate}
            t={t}
          />
        </Card>

        {/* Themes Card */}
        <Card title={t('configure.themes.title')}>
          <ThemesCard 
            themes={themes}
            setThemes={setThemes}
            onUpdate={handleThemesUpdate}
            t={t}
          />
        </Card>

      </Grid>
    </Animate>
  );
}
