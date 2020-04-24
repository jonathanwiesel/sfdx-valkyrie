import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { BypasserScanner } from '../../../shared/bypasserScanner';
import { MetadataModelBuilder } from '../../../shared/metadataModels/builder';
import { ValidationRuleModel } from  '../../../shared/metadataModels/validRuleModel';

Messages.importMessagesDirectory(__dirname);

const messages = Messages.loadMessages('sfdx-valkyrie', 'valkyrie');

export default class BypassValidRules extends SfdxCommand {

    public static description = messages.getMessage('bypassValidRulesCmdDescription'); 
    public static examples = [`
        sfdx vlk:bypasser:validrules -u someOrg
        sfdx vlk:bypasser:validrules -u someOrg -o Account,Contact
        sfdx vlk:bypasser:validrules -u someOrg -n Bypasser_API_Name__c
    `];

    protected static requiresUsername = true;

    protected static flagsConfig = {
        objects: flags.string({char: 'o', description: messages.getMessage('objectFilterFlagDescript')}),
        name: flags.string({char: 'n', description: messages.getMessage('bypasserNameFlagDescript'), required: true})
    };

    public async run(): Promise<any> {

        let filters = [];
        
        if (this.flags.objects) {
            filters = this.flags.objects.split(',');
        }

        const metaBuilder = new MetadataModelBuilder(this.ux, this.org, ValidationRuleModel);
        const bypasserScanner = new BypasserScanner(this.ux, this.flags.name, ValidationRuleModel.functionalName, filters);
        
        const models = await metaBuilder.fetchAndCreateMetadataModels(filters);

        return await bypasserScanner.exec(models);
    }
}