import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { BypasserScanner } from '../../../shared/bypasserScanner';
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { ProcessDefinitionModel } from  '../../../shared/metadataModels/processModel';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-valkyrie', 'valkyrie');

export default class BypassProcess extends SfdxCommand {

    public static description = messages.getMessage('bypassProcessCmdDescription');
    public static examples = [`
        sfdx vlk:bypasser:process -u someOrg
        sfdx vlk:bypasser:process -u someOrg -o Account,Contact
        sfdx vlk:bypasser:process -u someOrg -n Bypasser_API_Name__c
    `];

    protected static requiresUsername = true;

    protected static flagsConfig = {
        objects: flags.string({char: 'o', description: messages.getMessage('objectFilterFlagDescript')}),
        name: flags.string({char: 'n', description: messages.getMessage('bypasserNameFlagDescript'), required: true})
    };

    public async run(): Promise<any> {

        let filters = [];
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',').map(item => item.toLowerCase());
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, ProcessDefinitionModel);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, ProcessDefinitionModel.functionalName, filters);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels([], filters);

        return await bypasserScanner.exec(models);
    }
}