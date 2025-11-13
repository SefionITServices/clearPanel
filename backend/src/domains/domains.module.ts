import { Module } from '@nestjs/common';
import { DomainsService } from './domains.service';
import { DomainsController } from './domains.controller';
import { DnsModule } from '../dns/dns.module';
import { WebServerModule } from '../webserver/webserver.module';

@Module({
  imports: [DnsModule, WebServerModule],
  providers: [DomainsService],
  controllers: [DomainsController],
})
export class DomainsModule {}
