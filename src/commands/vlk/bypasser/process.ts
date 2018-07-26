import { SfdxCommand } from '@salesforce/command';
import { BypasserScanner } from '../../../shared/bypasserScanner';
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { ProcessModel } from  '../../../shared/metadataModels/processModel';

export default class BypassProcess extends SfdxCommand {

    public static description = 'Scan for bypassers in processes';
    public static examples = [`
sfdx vlk:bypasser:process -u someOrg
sfdx vlk:bypasser:process -u someOrg -o Account,Contact
sfdx vlk:bypasser:process -u someOrg -n Other_Bypasser_Name__c
    `];

    protected static requiresUsername = true;
    protected static requiresProject = false;
    protected static flagsConfig = {
        objects: { char: 'o', type: 'string', description: 'search in specified objects. Separate by comma if many' },
        name: { char: 'n', type: 'string', description: 'specify the bypasser name to search. Bypasser__c is the default' }
    };

    public async run(): Promise<any> {

        let filters = [];
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',').map(item => item.toLowerCase());
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, ProcessModel.metadataObj);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, ProcessModel.functionalName, filters);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels([], ProcessModel.createModelsFromDefinitionDescribe, filters);

        await bypasserScanner.exec(models);
    }
}