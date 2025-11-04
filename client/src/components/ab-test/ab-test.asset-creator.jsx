/***
*
*   AB TEST ASSET CREATOR
*   Component for creating variant assets (A and B) for AB testing
*   Takes a selectedGame prop and displays two tabs with MediaPlayer components
*
**********/

import { Tabs, TabsList, TabsTrigger, TabsContent, Grid, Card, Textarea, Button } from 'components/lib';
import MediaPlayer from '../edit/MediaPlayer';
import { Animate } from 'components/lib';

export function ABTestAssetCreator({ selectedGame }) {
  if (!selectedGame) {
    return null;
  }

  console.log('ABTestAssetCreator rendering with game:', selectedGame);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-lg">
      <Tabs defaultValue="variantA" className="flex flex-col h-full">
        <TabsList className="self-start w-auto mb-2">
         <TabsTrigger value="original">Original</TabsTrigger>
          <TabsTrigger value="variantA">Variant A</TabsTrigger>
          <TabsTrigger value="variantB">Variant B</TabsTrigger>
        </TabsList>
        <TabsContent value="original" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow">
            Original
        </TabsContent>
        
        <TabsContent value="variantA" className="p-3 bg-gradient-to-br from-slate-200 to-blue-50 flex-grow rounded-md">
         
         <Grid cols={2} >
            <Animate type='pop'>
            <Card title="Image">
         <div className="w-full max-w-[220px] mx-auto">
          <MediaPlayer
                gameId={selectedGame.id}
                imageUrl={null}
                videoUrl={null}
                type="both"
                readOnly={false}
                canSelect={false}
                showPlayIcon={true}
              />
         </div>
         <Textarea name="imageDescription" placeholder="Enter Ai image description" className="w-full mt-8" />
         <div className="flex flex-row gap-2 justify-end">
          <Button variant="outline" className="w-full mt-4">Delete</Button>
          <Button color="blue" className="w-full mt-4">Ai Generate</Button>
         </div>
        </Card>
            </Animate>
            <Animate type='pop'>
        <Card title="Video">
        <div className="w-full max-w-[220px] mx-auto">
          <MediaPlayer
                gameId={selectedGame.id}
                imageUrl={null}
                videoUrl={null}
                type="both"
                readOnly={false}
                canSelect={false}
                showPlayIcon={true}
              />
         </div>
         <Textarea name="videoDescription" placeholder="Enter Ai video description" className="w-full mt-8" />
         <div className="flex flex-row gap-2 justify-end">
          <Button variant="outline" className="w-full mt-4">Delete</Button>
          <Button color="blue" className="w-full mt-4">Ai Generate</Button>
          </div>
        </Card>
        </Animate>
         </Grid>

       
   
        </TabsContent>
        
        <TabsContent value="variantB" className="pt-2 space-y-4 flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 gap-4">
            {/* First MediaPlayer for Variant B */}
            <div className="w-full">
              <MediaPlayer
                gameId={selectedGame.id}
                imageUrl={null}
                videoUrl={null}
                type="both"
                readOnly={false}
                canSelect={false}
                showPlayIcon={true}
              />
            </div>
            
            {/* Second MediaPlayer for Variant B */}
            <div className="w-full">
              <MediaPlayer
                gameId={selectedGame.id}
                imageUrl={null}
                videoUrl={null}
                type="both"
                readOnly={false}
                canSelect={false}
                showPlayIcon={true}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

