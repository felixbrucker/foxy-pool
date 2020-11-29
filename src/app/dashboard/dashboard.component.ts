import {Component, OnInit} from '@angular/core';
import {PoolsService} from "../pools.service";
import * as Capacity from '../../shared/capacity.es5';
import * as moment from "moment";
import * as coinUtil from '../../shared/coin-util.es5';
import {ApiV2GatewayService} from "../api-v2-gateway.service";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private apiV2GatewayService = new ApiV2GatewayService();

  constructor(private poolsService: PoolsService) {}

  async ngOnInit() {
    this.apiV2GatewayService.poolIdentifier = this.pools
      .map((pool: any) => pool.poolIdentifier)
      .filter(identifier => !!identifier);
    this.apiV2GatewayService.init();
  }

  get pools() {
    return this.poolsService.pools;
  }

  getMinersOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    return poolStatsSubject.getValue().accountCount || poolStatsSubject.getValue().minerCount || 0;
  }

  getMachinesOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    const miners = poolStatsSubject.getValue().accounts || poolStatsSubject.getValue().miners || [];

    return miners.reduce((acc, miner) => {
      if (miner.machines) {
        return acc + miner.machines.length;
      }

      return acc + miner.miner.length;
    }, 0);
  }

  getCapacityOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    return this.getFormattedCapacityFromGiB(poolStatsSubject.getValue().totalCapacity || 0);
  }

  getRateOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    return (poolStatsSubject.getValue().rate || 0);
  }

  getDailyRewardOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    return (poolStatsSubject.getValue().dailyRewardPerPiB || 0);
  }

  getWonRoundsPerDayOfPool(pool) {
    const poolStatsSubject = this.apiV2GatewayService.getPoolStatsSubject(pool.poolIdentifier);
    if (!poolStatsSubject) {
      return 0;
    }

    const roundsWon = poolStatsSubject.getValue().roundsWon || [];

    return roundsWon.filter(round => {
      if (round.roundStart) {
        return moment(round.roundStart).isAfter(moment().subtract(1, 'day'));
      }

      return moment(round.createdAt).isAfter(moment().subtract(1, 'day'));
    }).length;
  }

  getNetDiffOfPool(pool) {
    const roundStatsSubject = this.apiV2GatewayService.getRoundStatsSubject(pool.poolIdentifier);
    if (!roundStatsSubject) {
      return 0;
    }

    const round = roundStatsSubject.getValue().round;
    if (!round) {
      return 0;
    }
    let netDiff = coinUtil.blockZeroBaseTarget(pool.coin) / round.baseTarget;
    netDiff = coinUtil.modifyNetDiff(netDiff, pool.coin);

    return this.getFormattedCapacityFromTiB(netDiff);
  }

  getFormattedCapacityFromGiB(capacityInGiB) {
    return (new Capacity(capacityInGiB)).toString();
  }

  getFormattedCapacityFromTiB(capacityInTiB) {
    return Capacity.fromTiB(capacityInTiB).toString();
  }
}
